// src/screens/MenuManagementScreen.jsx
import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Switch,
  Alert,
  Platform,
  SafeAreaView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { Header } from '../components/Header';
import { ItemFormModal } from '../components/ItemFormModal';

export const MenuManagementScreen = () => {
  const { categories, items, deleteItem, toggleItemAvailability, reorderCategories } = useApp();
  const [selectedCat, setSelectedCat] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);

  // If a category was deleted/pruned and was currently selected, reset filter to 'all'
  useEffect(() => {
    if (selectedCat !== 'all') {
      const exists = categories.some((c) => c._id === selectedCat);
      if (!exists) {
        setSelectedCat('all');
      }
    }
  }, [categories, selectedCat]);

  // Categories sorted by sequential position
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => (a.position || 0) - (b.position || 0));
  }, [categories]);

  // Group items by category into sections for SectionList
  const sections = useMemo(() => {
    const activeCats =
      selectedCat === 'all'
        ? sortedCategories
        : sortedCategories.filter((c) => c._id === selectedCat);

    return activeCats
      .map((cat, index) => {
        const catItems = items.filter((item) => {
          if (String(item.categoryId) !== String(cat._id)) return false;
          if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            return (
              item.name.toLowerCase().includes(q) ||
              (item.description && item.description.toLowerCase().includes(q))
            );
          }
          return true;
        });

        return {
          category: cat,
          categoryIndex: index,
          title: cat.name,
          data: catItems,
        };
      })
      .filter((sec) => (searchQuery.trim() ? sec.data.length > 0 : true));
  }, [sortedCategories, items, selectedCat, searchQuery]);

  // Handle reordering categories up or down
  const handleMoveCategory = (index, delta) => {
    const newIndex = index + delta;
    if (newIndex < 0 || newIndex >= sortedCategories.length) return;

    const reordered = [...sortedCategories];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(newIndex, 0, moved);

    reorderCategories(reordered);
  };

  const handleDelete = (item) => {
    const doDelete = () => {
      deleteItem(item._id);
    };

    if (Platform.OS === 'web') {
      if (
        window.confirm(
          `Are you sure you want to delete "${item.name}"? If this is the only item in its category, the category will also be removed automatically.`
        )
      ) {
        doDelete();
      }
    } else {
      Alert.alert(
        'Delete Menu Item',
        `Are you sure you want to remove "${item.name}"? If this is the only item in its category, the category will also be removed.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: doDelete },
        ]
      );
    }
  };

  const getCategoryName = (catId) => {
    const cat = categories.find((c) => c._id === catId);
    return cat ? cat.name : 'Cake';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Menu & Cake Catalog"
        subtitle="Manage categories, item order & web menu availability"
      />

      {/* Top Search & Action Bar */}
      <View style={styles.topBar}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color={COLORS.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search cakes, pastries, drinks..."
            placeholderTextColor={COLORS.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={COLORS.textLight} />
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Reorder Modal Button */}
        <TouchableOpacity
          style={styles.reorderModalBtn}
          onPress={() => setIsReorderModalOpen(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="swap-vertical" size={16} color={COLORS.primaryDark} />
          <Text style={styles.reorderModalBtnText}>Order</Text>
        </TouchableOpacity>

        {/* Add Cake Button */}
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            setEditingItem(null);
            setIsModalOpen(true);
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={18} color={COLORS.textWhite} />
          <Text style={styles.addBtnText}>Add Cake</Text>
        </TouchableOpacity>
      </View>

      {/* Categories Filter Carousel (Ordered as per category positions) */}
      <View style={styles.categoriesSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catScroll}
        >
          <TouchableOpacity
            style={[styles.catPill, selectedCat === 'all' && styles.catPillActive]}
            onPress={() => setSelectedCat('all')}
          >
            <Text style={[styles.catPillText, selectedCat === 'all' && styles.catPillTextActive]}>
              All ({items.length})
            </Text>
          </TouchableOpacity>

          {sortedCategories.map((cat, idx) => {
            const count = items.filter((i) => i.categoryId === cat._id).length;
            const isSelected = selectedCat === cat._id;
            return (
              <TouchableOpacity
                key={cat._id}
                style={[styles.catPill, isSelected && styles.catPillActive]}
                onPress={() => setSelectedCat(cat._id)}
              >
                <Text style={[styles.catPillText, isSelected && styles.catPillTextActive]}>
                  #{idx + 1} {cat.name} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Sectioned Items List by Category */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeaderCard}>
            <View style={styles.sectionHeaderLeft}>
              <View style={styles.sectionPosBadge}>
                <Text style={styles.sectionPosText}>#{section.categoryIndex + 1}</Text>
              </View>
              <Text style={styles.sectionHeaderTitle}>{section.title}</Text>
            </View>
            <View style={styles.sectionCountPill}>
              <Text style={styles.sectionCountPillText}>
                {section.data.length} {section.data.length === 1 ? 'cake' : 'cakes'}
              </Text>
            </View>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={[styles.itemCard, !item.available && styles.itemCardDisabled]}>
            <View style={styles.cardMain}>
              {/* Image Thumbnail */}
              <View style={styles.imageWrapper}>
                {item.image ? (
                  <Image
                    source={{ uri: item.image }}
                    style={styles.thumbnail}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.noImagePlaceholder}>
                    <Ionicons name="gift-outline" size={30} color={COLORS.primary} />
                  </View>
                )}
              </View>

              {/* Item Details */}
              <View style={styles.itemInfo}>
                <View style={styles.titleRow}>
                  <Text style={styles.categoryBadge}>{getCategoryName(item.categoryId)}</Text>
                  {item.offer && (
                    <View style={styles.offerBadge}>
                      <Text style={styles.offerBadgeText}>OFFER</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.itemName} numberOfLines={2}>
                  {item.name}
                </Text>

                {item.description ? (
                  <Text style={styles.itemDesc} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}

                {/* Pricing */}
                <View style={styles.pricingRow}>
                  {item.offer && item.offerPrice ? (
                    <>
                      <Text style={styles.activePrice}>₹{item.offerPrice}</Text>
                      <Text style={styles.originalPrice}>₹{item.price}</Text>
                    </>
                  ) : (
                    <Text style={styles.activePrice}>₹{item.price}</Text>
                  )}
                  {Array.isArray(item.variants) && item.variants.length > 0 && (
                    <Text style={styles.variantCountTag}>
                      ({item.variants.length} sizes)
                    </Text>
                  )}
                </View>

                {/* Weight Variants Pills */}
                {Array.isArray(item.variants) && item.variants.length > 0 && (
                  <View style={styles.variantsPillContainer}>
                    {item.variants.map((v, vIdx) => (
                      <View key={vIdx} style={styles.variantCatalogPill}>
                        <Text style={styles.variantCatalogWeight}>{v.weight}:</Text>
                        <Text style={styles.variantCatalogPrice}>₹{v.price}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Bottom Controls Bar */}
            <View style={styles.cardControls}>
              {/* Quick Availability Switch */}
              <View style={styles.stockToggle}>
                <Switch
                  value={item.available}
                  onValueChange={() => toggleItemAvailability(item._id)}
                  trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                  thumbColor={item.available ? COLORS.primary : '#ccc'}
                  style={
                    Platform.OS === 'web'
                      ? { transform: [{ scale: 0.8 }] }
                      : { transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }
                  }
                />
                <Text
                  style={[
                    styles.stockStatusText,
                    { color: item.available ? COLORS.success : COLORS.danger },
                  ]}
                >
                  {item.available ? 'In Stock (Live)' : 'Sold Out'}
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.itemActions}>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => {
                    setEditingItem(item);
                    setIsModalOpen(true);
                  }}
                >
                  <Ionicons name="create-outline" size={14} color={COLORS.primaryDark} />
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(item)}
                >
                  <Ionicons name="trash-outline" size={14} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        renderSectionFooter={({ section }) => {
          if (section.data.length === 0) {
            return (
              <View style={styles.emptySectionBox}>
                <Text style={styles.emptySectionText}>No cakes currently in {section.title}</Text>
              </View>
            );
          }
          return <View style={styles.sectionSpacer} />;
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="restaurant-outline" size={48} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>No Menu Items Found</Text>
            <Text style={styles.emptySubtitle}>
              Try changing categories or adding a new cake to the catalog.
            </Text>
          </View>
        }
      />

      {/* Add / Edit Cake Modal */}
      <ItemFormModal
        visible={isModalOpen}
        initialItem={editingItem}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
      />

      {/* Standalone Admin Category Reordering Modal */}
      <Modal
        visible={isReorderModalOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsReorderModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.reorderSheet}>
            <View style={styles.reorderSheetHeader}>
              <View>
                <Text style={styles.reorderSheetTitle}>Reorder Categories</Text>
                <Text style={styles.reorderSheetSubtitle}>
                  Changes order in "All" sections, category bar & web menu
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeModalBtn}
                onPress={() => setIsReorderModalOpen(false)}
              >
                <Ionicons name="close" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.reorderSheetList}>
              {sortedCategories.map((cat, idx) => {
                const count = items.filter((i) => i.categoryId === cat._id).length;
                const isFirst = idx === 0;
                const isLast = idx === sortedCategories.length - 1;

                return (
                  <View key={cat._id} style={styles.modalReorderRow}>
                    <View style={styles.modalPosBadge}>
                      <Text style={styles.modalPosText}>#{idx + 1}</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalCatName}>{cat.name}</Text>
                      <Text style={styles.modalCatCount}>
                        {count} {count === 1 ? 'cake' : 'cakes'}
                      </Text>
                    </View>

                    <View style={styles.modalArrowGroup}>
                      <TouchableOpacity
                        style={[styles.modalArrowBtn, isFirst && styles.modalArrowBtnDisabled]}
                        disabled={isFirst}
                        onPress={() => handleMoveCategory(idx, -1)}
                      >
                        <Ionicons
                          name="chevron-up"
                          size={18}
                          color={isFirst ? COLORS.border : COLORS.primaryDark}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.modalArrowBtn, isLast && styles.modalArrowBtnDisabled]}
                        disabled={isLast}
                        onPress={() => handleMoveCategory(idx, 1)}
                      >
                        <Ionicons
                          name="chevron-down"
                          size={18}
                          color={isLast ? COLORS.border : COLORS.primaryDark}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <View style={styles.reorderSheetFooter}>
              <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => setIsReorderModalOpen(false)}
              >
                <Text style={styles.doneBtnText}>Done Reordering</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    gap: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 8,
    ...SHADOWS.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  reorderModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 4,
  },
  reorderModalBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 4,
    ...SHADOWS.sm,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  categoriesSection: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  catScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  catPill: {
    backgroundColor: COLORS.surface,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  catPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  catPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  catPillTextActive: {
    color: COLORS.textWhite,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  sectionHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF9EE',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
    marginBottom: 10,
    ...SHADOWS.sm,
  },
  sectionHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionPosBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  sectionPosText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  sectionCountPill: {
    backgroundColor: '#FFF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  sectionCountPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  sectionSpacer: {
    height: 8,
  },
  emptySectionBox: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAF9',
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  emptySectionText: {
    fontSize: 12,
    color: COLORS.textLight,
    fontStyle: 'italic',
  },
  itemCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  itemCardDisabled: {
    opacity: 0.72,
    backgroundColor: '#FDFBF9',
  },
  cardMain: {
    flexDirection: 'row',
    gap: 12,
  },
  imageWrapper: {
    width: 90,
    height: 90,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  noImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
  },
  itemInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  categoryBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  offerBadge: {
    backgroundColor: COLORS.danger,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  offerBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textWhite,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  itemDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  pricingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  activePrice: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  originalPrice: {
    fontSize: 12,
    color: COLORS.textLight,
    textDecorationLine: 'line-through',
  },
  variantCountTag: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primaryDark,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  variantsPillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 8,
  },
  variantCatalogPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDF9',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
  },
  variantCatalogWeight: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  variantCatalogPrice: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  cardControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  stockToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stockStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  deleteBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceAlt,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  reorderSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    ...SHADOWS.lg,
  },
  reorderSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  reorderSheetTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  reorderSheetSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  closeModalBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reorderSheetList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalReorderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDF9',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    gap: 10,
  },
  modalPosBadge: {
    width: 32,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPosText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  modalCatName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  modalCatCount: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 1,
  },
  modalArrowGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalArrowBtnDisabled: {
    opacity: 0.35,
    borderColor: '#E5E7EB',
  },
  reorderSheetFooter: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  doneBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textWhite,
  },
});
