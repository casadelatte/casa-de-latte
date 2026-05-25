"use client";

import React, { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  UtensilsCrossed,
  X,
  Check,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { debounce } from "@/lib/debounce";

interface DbCategory {
  id: string;
  name: string;
  description: string;
  icon_name: string;
  sort_order: number;
}

interface DbItem {
  id: string;
  category_id: string;
  name: string;
  price: number;
  description: string;
  ingredients: string[];
  is_hot_available: boolean;
  is_cold_available: boolean;
  requires_milk_customization: boolean;
  requires_roast_profile: boolean;
  is_available: boolean;
  sort_order: number;
}

const emptyForm = {
  name: "",
  price: "",
  categoryId: "hot-brews",
  description: "",
  isHotAvailable: false,
  isColdAvailable: false,
  requiresMilkCustomization: false,
  requiresRoastProfile: false,
};

export default function MenuManager() {
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [items, setItems] = useState<DbItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    iconName: "Coffee",
    sortOrder: "0",
  });

  const loadMenu = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/menu?scope=admin");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load menu.");
      }
      const data = await res.json();
      setCategories(data.categories ?? []);
      setItems(data.items ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load menu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMenu();
    const debouncedRefresh = debounce(() => void loadMenu(), 650);
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel("cdl-admin-menu")
      .on("postgres_changes", { event: "*", schema: "public", table: "menu_items" }, debouncedRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "menu_categories" }, debouncedRefresh)
      .subscribe();

    return () => {
      debouncedRefresh.cancel();
      supabase.removeChannel(channel);
    };
  }, [loadMenu]);

  const filteredItems =
    filterCategory === "all" ? items : items.filter((i) => i.category_id === filterCategory);

  const startEdit = (item: DbItem) => {
    setEditingId(item.id);
    setShowAddForm(false);
    setForm({
      name: item.name,
      price: String(item.price),
      categoryId: item.category_id,
      description: item.description || "",
      isHotAvailable: item.is_hot_available,
      isColdAvailable: item.is_cold_available,
      requiresMilkCustomization: item.requires_milk_customization,
      requiresRoastProfile: item.requires_roast_profile,
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setShowAddForm(false);
    setForm(emptyForm);
  };

  const saveItem = async () => {
    if (!form.name.trim() || !form.price) {
      setError("Name and price are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name.trim(),
        price: Number(form.price),
        categoryId: form.categoryId,
        description: form.description,
        isHotAvailable: form.isHotAvailable,
        isColdAvailable: form.isColdAvailable,
        requiresMilkCustomization: form.requiresMilkCustomization,
        requiresRoastProfile: form.requiresRoastProfile,
      };

      if (editingId) {
        const res = await fetch(`/api/menu/items/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Update failed.");
      } else {
        const res = await fetch("/api/menu/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Create failed.");
      }
      resetForm();
      await loadMenu();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailability = async (item: DbItem) => {
    try {
      const res = await fetch(`/api/menu/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: !item.is_available }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Toggle failed.");
      await loadMenu();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Toggle failed.");
    }
  };

  const resetCategoryForm = () => {
    setEditingCategoryId(null);
    setShowCategoryForm(false);
    setCategoryForm({ name: "", description: "", iconName: "Coffee", sortOrder: "0" });
  };

  const startEditCategory = (cat: DbCategory) => {
    setEditingCategoryId(cat.id);
    setShowCategoryForm(true);
    setCategoryForm({
      name: cat.name,
      description: cat.description || "",
      iconName: cat.icon_name,
      sortOrder: String(cat.sort_order),
    });
  };

  const saveCategory = async () => {
    if (!categoryForm.name.trim()) {
      setError("Category name is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: categoryForm.name.trim(),
        description: categoryForm.description,
        iconName: categoryForm.iconName,
        sortOrder: Number(categoryForm.sortOrder) || 0,
      };
      if (editingCategoryId) {
        const res = await fetch(`/api/menu/categories/${editingCategoryId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Update failed.");
      } else {
        const res = await fetch("/api/menu/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Create failed.");
      }
      resetCategoryForm();
      await loadMenu();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Category save failed.");
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Delete this category? It must have no menu items.")) return;
    try {
      const res = await fetch(`/api/menu/categories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Delete failed.");
      if (editingCategoryId === id) resetCategoryForm();
      await loadMenu();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Category delete failed.");
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this menu item permanently?")) return;
    try {
      const res = await fetch(`/api/menu/items/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Delete failed.");
      if (editingId === id) resetForm();
      await loadMenu();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Delete failed.");
    }
  };

  if (loading) {
    return (
      <div className="glass rounded-3xl p-8 border border-white/5 text-center">
        <span className="text-xs uppercase tracking-widest text-warm-beige/50 animate-pulse">
          Loading menu catalog...
        </span>
      </div>
    );
  }

  return (
    <div className="glass rounded-3xl p-6 md:p-8 border border-white/5 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <UtensilsCrossed size={18} className="text-crema" />
          <div>
            <h3 className="font-serif text-lg font-bold text-crema uppercase tracking-wide">
              Menu Manager
            </h3>
            <p className="text-[10px] text-warm-beige/50 uppercase tracking-widest mt-0.5">
              Live updates to customer menu · {items.length} items
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={loadMenu}
            className="p-2.5 rounded-xl border bg-white/5 border-white/10 text-crema hover:bg-white/10 transition"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowAddForm(true);
            }}
            className="bg-crema hover:bg-crema-light text-matte-black text-xs font-extrabold uppercase px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition"
          >
            <Plus size={14} /> Add Item
          </button>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 font-bold">
          {error}
        </p>
      )}

      <div className="border border-white/5 rounded-2xl p-4 bg-black/20 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs font-bold text-crema uppercase tracking-widest">Categories</span>
          <button
            type="button"
            onClick={() => {
              resetCategoryForm();
              setShowCategoryForm(true);
            }}
            className="text-[10px] font-extrabold uppercase px-3 py-1.5 rounded-lg border border-crema/30 text-crema hover:bg-crema/10 transition"
          >
            <Plus size={12} className="inline mr-1" />
            Add Category
          </button>
        </div>

        <AnimatePresence>
          {showCategoryForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-2 overflow-hidden"
            >
              <input
                placeholder="Category name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-cream-light focus:border-crema outline-none"
              />
              <input
                placeholder="Icon (Lucide name, e.g. Coffee)"
                value={categoryForm.iconName}
                onChange={(e) => setCategoryForm({ ...categoryForm, iconName: e.target.value })}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-cream-light focus:border-crema outline-none"
              />
              <input
                placeholder="Sort order"
                type="number"
                value={categoryForm.sortOrder}
                onChange={(e) => setCategoryForm({ ...categoryForm, sortOrder: e.target.value })}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-cream-light focus:border-crema outline-none"
              />
              <input
                placeholder="Description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-cream-light focus:border-crema outline-none md:col-span-2"
              />
              <div className="md:col-span-2 flex gap-2">
                <button
                  type="button"
                  onClick={saveCategory}
                  disabled={saving}
                  className="bg-crema text-matte-black text-[10px] font-extrabold uppercase px-4 py-2 rounded-xl disabled:opacity-50"
                >
                  {editingCategoryId ? "Save Category" : "Create Category"}
                </button>
                <button
                  type="button"
                  onClick={resetCategoryForm}
                  className="text-[10px] font-bold uppercase px-4 py-2 rounded-xl border border-white/10 text-warm-beige"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-1 pl-3 pr-1 py-1 rounded-xl border border-white/10 bg-white/5 text-[10px]"
            >
              <span className="font-bold text-warm-beige">{c.name}</span>
              <button
                type="button"
                onClick={() => startEditCategory(c)}
                className="p-1.5 rounded-lg hover:text-crema text-warm-beige/60"
                title="Edit category"
              >
                <Pencil size={11} />
              </button>
              <button
                type="button"
                onClick={() => deleteCategory(c.id)}
                className="p-1.5 rounded-lg hover:text-red-400 text-warm-beige/60"
                title="Delete category"
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setFilterCategory("all")}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase whitespace-nowrap border transition ${
            filterCategory === "all"
              ? "bg-crema border-crema text-matte-black"
              : "bg-white/5 border-white/10 text-warm-beige"
          }`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setFilterCategory(c.id)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase whitespace-nowrap border transition ${
              filterCategory === c.id
                ? "bg-crema border-crema text-matte-black"
                : "bg-white/5 border-white/10 text-warm-beige"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {(showAddForm || editingId) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-black/30 border border-crema/15 rounded-2xl p-4 space-y-3 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-crema uppercase tracking-widest">
                {editingId ? "Edit Item" : "New Item"}
              </span>
              <button onClick={resetForm} className="text-warm-beige/40 hover:text-crema">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                placeholder="Item name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-cream-light focus:border-crema outline-none"
              />
              <input
                type="number"
                placeholder="Price (₹)"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-cream-light focus:border-crema outline-none"
              />
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-cream-light focus:border-crema outline-none md:col-span-2"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-matte-black">
                    {c.name}
                  </option>
                ))}
              </select>
              <textarea
                placeholder="Description (optional)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-cream-light focus:border-crema outline-none md:col-span-2 resize-none"
              />
            </div>
            <div className="flex flex-wrap gap-3 text-[10px]">
              {(
                [
                  ["isHotAvailable", "Hot"],
                  ["isColdAvailable", "Cold"],
                  ["requiresMilkCustomization", "Milk options"],
                  ["requiresRoastProfile", "Roast Profile"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-1.5 text-warm-beige cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                    className="accent-crema"
                  />
                  {label}
                </label>
              ))}
            </div>
            <button
              onClick={saveItem}
              disabled={saving}
              className="w-full md:w-auto bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs uppercase px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:border-emerald-400 transition disabled:opacity-50"
            >
              <Check size={14} />
              {saving ? "Saving..." : editingId ? "Save Changes" : "Create Item"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2 max-h-[480px] overflow-y-auto no-scrollbar">
        {filteredItems.length === 0 ? (
          <p className="text-center text-xs text-white/30 italic py-8">No items in this category.</p>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 p-3 rounded-2xl border transition ${
                item.is_available
                  ? "bg-white/5 border-white/5"
                  : "bg-black/40 border-white/5 opacity-60"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-warm-beige truncate">{item.name}</span>
                  <span className="text-xs font-bold text-crema">₹{Number(item.price)}</span>
                  {!item.is_available && (
                    <span className="text-[9px] uppercase bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full font-bold">
                      Hidden
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-warm-beige/40 uppercase tracking-wider">
                  {categories.find((c) => c.id === item.category_id)?.name || item.category_id}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => toggleAvailability(item)}
                  className="p-2 rounded-lg bg-white/5 border border-white/10 text-warm-beige hover:text-crema transition"
                  title={item.is_available ? "Hide from menu" : "Show on menu"}
                >
                  {item.is_available ? <Eye size={13} /> : <EyeOff size={13} />}
                </button>
                <button
                  onClick={() => startEdit(item)}
                  className="p-2 rounded-lg bg-white/5 border border-white/10 text-warm-beige hover:text-crema transition"
                  title="Edit"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition"
                  title="Delete"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
