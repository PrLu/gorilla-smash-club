'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button, Card, Modal, Switch } from '@/components/ui';
import { 
  Plus, Edit, Trash2, Save, X, Users, Layers, Check, AlertTriangle, GripVertical 
} from 'lucide-react';
import { 
  useCategories, 
  useCreateCategory, 
  useUpdateCategory, 
  useDeleteCategory,
  useReorderCategories,
  Category 
} from '@/lib/hooks/useCategories';
import { useIsAdmin } from '@/lib/hooks/useUserRole';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import toast from 'react-hot-toast';

// Sortable Row Component
function SortableRow({ category, onEdit, onDelete }: { 
  category: Category; 
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr 
      ref={setNodeRef} 
      style={style}
      className={`
        transition-all duration-200
        hover:bg-gray-50 dark:hover:bg-gray-800 
        ${isDragging 
          ? 'shadow-2xl bg-primary-50 dark:bg-primary-900/30 scale-105 z-50 border-2 border-primary-400 dark:border-primary-600 rounded-lg' 
          : 'border-b border-gray-200 dark:border-gray-700'
        }
      `}
    >
      <td className="px-4 py-4">
        <div 
          {...attributes} 
          {...listeners}
          className={`
            cursor-grab active:cursor-grabbing 
            transition-colors p-1 rounded
            hover:bg-gray-200 dark:hover:bg-gray-700
            ${isDragging ? 'bg-primary-100 dark:bg-primary-800' : ''}
          `}
          title="Drag to reorder"
        >
          <GripVertical className={`h-5 w-5 ${isDragging ? 'text-primary-600' : 'text-gray-400'}`} />
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {category.display_name}
        </div>
        {category.description && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {category.description}
          </div>
        )}
      </td>
      <td className="px-4 py-4">
        <code className="text-sm font-mono text-gray-600 dark:text-gray-400">
          {category.name}
        </code>
      </td>
      <td className="px-4 py-4">
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
          category.is_team_based
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
            : 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
        }`}>
          {category.is_team_based ? (
            <>
              <Users className="h-3 w-3" />
              Team-based
            </>
          ) : (
            'Individual'
          )}
        </span>
      </td>
      <td className="px-4 py-4">
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
          category.is_active
            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
        }`}>
          {category.is_active ? (
            <>
              <Check className="h-3 w-3" />
              Active
            </>
          ) : (
            'Inactive'
          )}
        </span>
      </td>
      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
        {category.sort_order}
      </td>
      <td className="px-4 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(category)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(category)}
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

export default function MasterDataPage() {
  const { isAdmin, isLoading: roleLoading } = useIsAdmin();
  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const reorderCategories = useReorderCategories();

  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Category | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Local state for drag-and-drop ordering
  const [orderedCategories, setOrderedCategories] = useState<Category[]>([]);

  // Update local ordered categories when data changes
  useEffect(() => {
    if (categories) {
      setOrderedCategories([...categories]);
    }
  }, [categories]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Form state - use separate state for each field to prevent re-render issues
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [isTeamBased, setIsTeamBased] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);

  const resetForm = useCallback(() => {
    setName('');
    setDisplayName('');
    setDescription('');
    setIsTeamBased(false);
    setIsActive(true);
    setSortOrder(0);
  }, []);

  const handleCreate = useCallback(async () => {
    try {
      await createCategory.mutateAsync({
        name,
        display_name: displayName,
        description,
        is_team_based: isTeamBased,
        is_active: isActive,
        sort_order: sortOrder,
      });
      toast.success('Category created successfully');
      setShowForm(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create category');
    }
  }, [name, displayName, description, isTeamBased, isActive, sortOrder, createCategory, resetForm]);

  const handleUpdate = useCallback(async () => {
    if (!editingCategory) return;

    try {
      await updateCategory.mutateAsync({
        id: editingCategory.id,
        name,
        display_name: displayName,
        description,
        is_team_based: isTeamBased,
        is_active: isActive,
        sort_order: sortOrder,
      });
      toast.success('Category updated successfully');
      setEditingCategory(null);
      setShowForm(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update category');
    }
  }, [editingCategory, name, displayName, description, isTeamBased, isActive, sortOrder, updateCategory, resetForm]);

  const handleDelete = useCallback(async () => {
    if (!deleteConfirm) return;

    try {
      await deleteCategory.mutateAsync(deleteConfirm.id);
      toast.success('Category deleted successfully');
      setDeleteConfirm(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete category');
    }
  }, [deleteConfirm, deleteCategory]);

  const openEditForm = useCallback((category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setDisplayName(category.display_name);
    setDescription(category.description || '');
    setIsTeamBased(category.is_team_based);
    setIsActive(category.is_active);
    setSortOrder(category.sort_order);
    setShowForm(true);
  }, []);

  const openCreateForm = useCallback(() => {
    resetForm();
    setEditingCategory(null);
    setShowForm(true);
  }, [resetForm]);

  const closeForm = useCallback(() => {
    setShowForm(false);
    setEditingCategory(null);
    resetForm();
  }, [resetForm]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = orderedCategories.findIndex((cat) => cat.id === active.id);
    const newIndex = orderedCategories.findIndex((cat) => cat.id === over.id);

    const newOrder = arrayMove(orderedCategories, oldIndex, newIndex);
    
    // Optimistically update UI
    setOrderedCategories(newOrder);

    // Update sort_order for all categories
    const categoryOrders = newOrder.map((cat, index) => ({
      id: cat.id,
      sort_order: index,
    }));

    try {
      await reorderCategories.mutateAsync(categoryOrders);
      toast.success('Category order updated');
    } catch (error: any) {
      // Revert on error
      setOrderedCategories(categories || []);
      toast.error(error.message || 'Failed to reorder categories');
    }
  }, [orderedCategories, categories, reorderCategories]);

  const activeCategory = orderedCategories.find(cat => cat.id === activeId);

  // Show loading while checking role
  if (roleLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12 text-gray-500">Loading...</div>
      </div>
    );
  }

  // Check if user is admin or root
  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card padding="lg">
          <div className="text-center py-12">
            <AlertTriangle className="mx-auto h-12 w-12 text-warning-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Only administrators can access master data management.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Left Side - Categories List */}
      <div className={`flex-1 overflow-auto transition-all duration-300 ${showForm ? 'mr-0' : ''}`}>
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Master Data Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Configure categories and other master data for tournaments
            </p>
          </div>

          {/* Categories Section */}
          <Card padding="lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Layers className="h-6 w-6 text-primary-600" />
              Tournament Categories
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Manage available categories for tournaments (Singles, Doubles, etc.)
            </p>
          </div>
          <Button
            variant="primary"
            leftIcon={<Plus className="h-5 w-5" />}
            onClick={openCreateForm}
          >
            Add Category
          </Button>
        </div>

        {/* Categories Table */}
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading categories...</div>
        ) : orderedCategories && orderedCategories.length > 0 ? (
          <div className="overflow-x-auto">
            <div className="mb-4 rounded-lg bg-blue-50 border border-blue-200 p-3 dark:bg-blue-900/20 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <GripVertical className="inline h-4 w-4 mr-1" />
                <strong>Drag & Drop</strong> to reorder categories. Changes apply everywhere instantly.
              </p>
            </div>
            
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="w-12 px-4 py-3"></th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Display Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Internal Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <SortableContext
                  items={orderedCategories.map(cat => cat.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {orderedCategories.map((category) => (
                      <SortableRow
                        key={category.id}
                        category={category}
                        onEdit={openEditForm}
                        onDelete={setDeleteConfirm}
                      />
                    ))}
                  </tbody>
                </SortableContext>
              </table>
              
              <DragOverlay>
                {activeCategory ? (
                  <table className="w-full shadow-2xl rounded-lg overflow-hidden">
                    <tbody className="bg-white dark:bg-gray-800">
                      <tr className="border-2 border-primary-500">
                        <td className="px-4 py-4">
                          <GripVertical className="h-5 w-5 text-primary-600" />
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {activeCategory.display_name}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <code className="text-sm font-mono text-gray-600 dark:text-gray-400">
                            {activeCategory.name}
                          </code>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                            activeCategory.is_team_based
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}>
                            {activeCategory.is_team_based ? (
                              <>
                                <Users className="h-3 w-3" />
                                Team-based
                              </>
                            ) : (
                              'Individual'
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                            activeCategory.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {activeCategory.is_active ? (
                              <>
                                <Check className="h-3 w-3" />
                                Active
                              </>
                            ) : (
                              'Inactive'
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {activeCategory.sort_order}
                        </td>
                        <td className="px-4 py-4"></td>
                      </tr>
                    </tbody>
                  </table>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No categories found. Add your first category to get started.
          </div>
        )}
          </Card>
        </div>
      </div>

      {/* Right Side - Form Panel */}
      {showForm && (
        <div 
          key={editingCategory?.id || 'new'}
          className="w-full md:w-1/2 lg:w-2/5 xl:w-1/3 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-auto"
        >
          <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingCategory ? 'Edit Category' : 'Create Category'}
              </h2>
              <button
                onClick={closeForm}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Display Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              placeholder="e.g., Singles, Doubles, Mixed"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Internal Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              placeholder="e.g., singles, doubles, mixed (lowercase, no spaces)"
              value={name}
              onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
              autoComplete="off"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Used internally - lowercase, no spaces</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              placeholder="Brief description of this category"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="space-y-3 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <Switch
              label="Team-Based Category"
              description="Enable for categories that require teams (e.g., Doubles, Mixed)"
              checked={isTeamBased}
              onChange={(checked) => setIsTeamBased(checked)}
            />

            <Switch
              label="Active"
              description="Only active categories are shown in forms"
              checked={isActive}
              onChange={(checked) => setIsActive(checked)}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Sort Order
            </label>
            <input
              type="number"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              placeholder="0"
              value={sortOrder}
              onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
              autoComplete="off"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Lower numbers appear first</p>
          </div>

          <div className="sticky bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 mt-6">
            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={closeForm}
                className="flex-1"
                disabled={createCategory.isPending || updateCategory.isPending}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={editingCategory ? handleUpdate : handleCreate}
                isLoading={createCategory.isPending || updateCategory.isPending}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                {editingCategory ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Category"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex gap-3 rounded-lg bg-red-50 border border-red-200 p-4 dark:bg-red-900/20 dark:border-red-800">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
            <div className="text-sm text-red-700 dark:text-red-400">
              <p className="font-semibold mb-1">Are you sure?</p>
              <p>
                This will permanently delete the category <strong>{deleteConfirm?.display_name}</strong>.
                This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={() => setDeleteConfirm(null)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={deleteCategory.isPending}
              className="flex-1"
            >
              Delete Category
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

