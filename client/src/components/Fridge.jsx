// ==========================
// IMPORTS
// ==========================
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

// ==========================
// FRIDGE COMPONENT (no auth, no user_id)
// ==========================
// Changes for no-auth Supabase (RLS disabled):
// - Removed all supabase.auth calls
// - Removed user_id filtering and inserts
// - Clear-expired deletes only items you currently see as expired (by id)
// - expires_on is assumed to be timestamptz in DB (pairs with toISOString)

export default function Fridge() {
  // --------------------------
  // STATE
  // --------------------------
  const [items, setItems] = useState([]);             // Fridge rows from DB
  const [newItem, setNewItem] = useState('');         // New item input
  const [expiryDate, setExpiryDate] = useState('');   // New item expiry input (yyyy-mm-dd)
  const [searchTerm, setSearchTerm] = useState('');   // Client-side filter string
  const [editingItemId, setEditingItemId] = useState(null);       // Currently edited row id
  const [newExpiryForEdit, setNewExpiryForEdit] = useState('');    // Temp date during edit
  const [loading, setLoading] = useState(true);       // Initial fetch spinner

  // ==========================
  // INITIAL LOAD (no auth)
  // ==========================
  // Fetch all items on mount. With RLS disabled, everyone sees the same data.
  useEffect(() => {
    (async () => {
      await fetchItems();
      setLoading(false);
    })();
  }, []);

  // ==========================
  // READ: FETCH ITEMS
  // ==========================
  // Pull all rows and order by soonest expiry first.
  const fetchItems = async () => {
    const { data, error } = await supabase
      .from('fridge')
      .select('id, item_name, expires_on')
      .order('expires_on', { ascending: true });

    if (error) {
      console.error('Error fetching items:', error);
      return;
    }
    setItems(data || []);
  };

  // ==========================
  // CREATE: ADD NEW ITEM
  // ==========================
  // Inserts a row with item_name and expires_on. No user_id.
  const handleAddItem = async () => {
    if (!newItem || !expiryDate) {
      alert('Fill both fields!');
      return;
    }

    const payload = {
      item_name: newItem,
      added_on: new Date().toISOString(),                 // DB column timestamptz
      expires_on: new Date(expiryDate).toISOString(),     // convert yyyy-mm-dd → ISO
    };

    const { error } = await supabase.from('fridge').insert([payload]);

    if (error) {
      console.error('Insert error:', error);
      return;
    }
    setNewItem('');
    setExpiryDate('');
    fetchItems();
  };

  // ==========================
  // DELETE: REMOVE ONE ITEM
  // ==========================
  const handleDeleteItem = async (itemId) => {
    const { error } = await supabase.from('fridge').delete().eq('id', itemId);
    if (error) {
      console.error('Delete error:', error);
      return;
    }
    fetchItems();
  };

  // ==========================
  // BULK DELETE: CLEAR EXPIRED (SAFE LOCAL SCOPE)
  // ==========================
  // Instead of deleting all expired rows globally, we:
  // 1) compute expired items from the currently loaded list
  // 2) delete only those ids (prevents accidental global wipe in shared DB)
  const handleClearExpired = async () => {
    const now = new Date();
    const expiredIds = items
      .filter((it) => {
        if (!it.expires_on) return false;
        const exp = new Date(it.expires_on);
        return exp <= now;
      })
      .map((it) => it.id);

    if (expiredIds.length === 0) {
      alert('No expired items to clear.');
      return;
    }

    const { error } = await supabase
      .from('fridge')
      .delete()
      .in('id', expiredIds);

    if (error) {
      console.error('Error clearing expired:', error);
      return;
    }
    fetchItems();
  };

  // ==========================
  // UPDATE: START EDITING
  // ==========================
  const handleEditClick = (itemId, currentExpiry) => {
    setEditingItemId(itemId);
    // Pre-fill date input in yyyy-mm-dd (strip time zone portion)
    setNewExpiryForEdit(currentExpiry ? currentExpiry.split('T')[0] : '');
  };

  // ==========================
  // UPDATE: SAVE EDITED EXPIRY
  // ==========================
  const handleSaveEdit = async () => {
    if (!newExpiryForEdit) {
      alert('Please select a new date.');
      return;
    }

    const { error } = await supabase
      .from('fridge')
      .update({ expires_on: new Date(newExpiryForEdit).toISOString() })
      .eq('id', editingItemId);

    if (error) {
      console.error('Update error:', error);
      return;
    }
    setEditingItemId(null);
    setNewExpiryForEdit('');
    fetchItems();
  };

  // ==========================
  // HELPERS
  // ==========================
  const formatDate = (dateStr) => {
    if (!dateStr) return 'No expiry set';
    const parsed = new Date(dateStr);
    return Number.isNaN(parsed.getTime()) ? 'Invalid Date' : parsed.toLocaleDateString();
  };

  const daysLeft = (dateStr) => {
    if (!dateStr) return null;
    const expiry = new Date(dateStr);
    const today = new Date();
    const diffTime = expiry - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getColorClass = (days) => {
    if (days === null) return 'bg-gray-200 text-gray-800';
    if (days < 0) return 'bg-red-200 text-red-800';
    if (days <= 2) return 'bg-red-100 text-red-800';
    if (days <= 5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  // Client-side filtering by item name
  const filteredItems = items.filter((item) =>
    item.item_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ==========================
  // RENDER
  // ==========================
  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-4">
      {/* Search + Clear expired */}
      <div className="flex flex-col md:flex-row md:space-x-4 mb-6">
        <input
          type="text"
          placeholder="Search items..."
          className="border p-2 rounded mb-2 md:mb-0"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          onClick={handleClearExpired}
        >
          Clear Expired Items
        </button>
      </div>

      {/* Items grid */}
      {filteredItems.length === 0 ? (
        <p className="text-gray-600">No items found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const days = daysLeft(item.expires_on);
            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl shadow hover:scale-105 transition-transform ${getColorClass(days)}`}
              >
                <h3 className="text-lg font-bold">{item.item_name}</h3>
                <p className="text-sm">
                  Expires on:{' '}
                  <span className="font-medium">{formatDate(item.expires_on)}</span>
                </p>
                {days !== null && (
                  <p className="text-sm">
                    {days >= 0 ? `${days} day${days === 1 ? '' : 's'} left` : 'Expired'}
                  </p>
                )}

                {/* Edit / Delete */}
                {editingItemId === item.id ? (
                  <>
                    <input
                      type="date"
                      className="border p-1 rounded mt-2 w-full text-sm"
                      value={newExpiryForEdit}
                      onChange={(e) => setNewExpiryForEdit(e.target.value)}
                    />
                    <button
                      className="mt-2 bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                      onClick={handleSaveEdit}
                    >
                      Save
                    </button>
                  </>
                ) : (
                  <div className="flex space-x-4 mt-2">
                    <button
                      className="text-sm text-blue-600 hover:underline"
                      onClick={() => handleEditClick(item.id, item.expires_on)}
                    >
                      Edit
                    </button>
                    <button
                      className="text-sm text-red-600 hover:underline"
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add new item */}
      <div className="mt-8 p-4 bg-green-50 rounded-xl shadow">
        <h3 className="text-lg font-semibold mb-2 text-emerald-700">Add New Item</h3>
        <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
          <input
            className="border p-2 rounded flex-1"
            type="text"
            placeholder="e.g. tofu"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
          />
          <input
            className="border p-2 rounded"
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
          />
          <button
            className="bg-emerald-700 text-white px-4 py-2 rounded hover:bg-green-600"
            onClick={handleAddItem}
          >
            + Add
          </button>
        </div>
      </div>
    </div>
  );
}
