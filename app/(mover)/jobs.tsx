import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Linking,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { FilterTabs } from '../../src/components';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../src/constants/theme';
import { useMoverStore, MoverJob } from '../../src/store/moverStore';

const TABS = ['Open Moving Gigs', 'My Accepted Jobs'];

export default function JobsScreen() {
  const [activeTab, setActiveTab] = useState(0);
  const { jobs, myServices, acceptJob, startGpsNavigation, fetchJobs, fetchMyServices, createService, updateService } = useMoverStore();

  useEffect(() => {
    fetchJobs().catch((error) => Alert.alert('Jobs Error', error?.message || 'Unable to load moving jobs.'));
    fetchMyServices().catch((error) => Alert.alert('Service Error', error?.message || 'Unable to load your services.'));
  }, [fetchJobs, fetchMyServices]);

  // GPS Route Modal State
  const [selectedGpsJob, setSelectedGpsJob] = useState<MoverJob | null>(null);
  const [isGpsModalOpen, setIsGpsModalOpen] = useState(false);

  // Create Service Modal State
  const [isCreateServiceOpen, setIsCreateServiceOpen] = useState(false);
  const [serviceName, setServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');

  const hasActiveService = myServices.length > 0;

  const handleAccept = async (job: MoverJob) => {
    try {
      await acceptJob(job.id);
      Alert.alert('Moving Job Accepted', `You accepted the move for ${job.client_name} on ${job.move_in_date}.`);
    } catch (error: any) {
      Alert.alert('Accept Failed', error?.message || 'Unable to accept this job.');
    }
  };

  const handleOpenGpsRoute = async (job: MoverJob) => {
    setSelectedGpsJob(job);
    try {
      await startGpsNavigation(job.id);
      setIsGpsModalOpen(true);
    } catch (error: any) {
      Alert.alert('Navigation Update Failed', error?.message || 'Unable to start this job.');
    }
  };

  const handleCreateService = async () => {
    if (!serviceName.trim()) {
      Alert.alert('Missing Info', 'Please enter a name for your moving service.');
      return;
    }
    if (!servicePrice.trim()) {
      Alert.alert('Missing Info', 'Please enter a base price for your moving service.');
      return;
    }

    const priceNum = parseInt(servicePrice.replace(/[^0-9]/g, ''), 10);
    if (!priceNum || priceNum <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price greater than 0.');
      return;
    }

    try {
      const service = await createService({
        name: serviceName.trim(),
        description: serviceDescription.trim() || 'Professional local hauling and relocation service across Nairobi.',
        price: priceNum,
      });
      setIsCreateServiceOpen(false);
      setServiceName('');
      setServicePrice('');
      setServiceDescription('');
      Alert.alert('Service Published! 🎉', `"${service.name}" is now live. Clients can find and book your moving service.`);
    } catch (error: any) {
      Alert.alert('Service Creation Failed', error?.message || 'Unable to publish your moving service.');
    }
  };

  const handleToggleAvailability = async () => {
    if (myServices.length === 0) return;
    const service = myServices[0];
    try {
      await updateService(service.id, { availability: !service.availability });
      Alert.alert(
        service.availability ? 'Service Paused' : 'Service Activated',
        service.availability
          ? 'Your moving service is now hidden from clients.'
          : 'Your moving service is now visible and accepting bookings.'
      );
    } catch (error: any) {
      Alert.alert('Update Failed', error?.message || 'Unable to update service availability.');
    }
  };

  const filteredJobs = activeTab === 0
    ? jobs.filter((j) => j.status === 'Open')
    : jobs.filter((j) => j.status !== 'Open');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Hauling & Moving Gigs</Text>
          <Text style={styles.subtitle}>Local relocation jobs linked with client move-in dates</Text>
        </View>

        {/* Service Status Banner or Create Service Card */}
        {hasActiveService ? (
          <View style={styles.serviceBanner}>
            <View style={styles.serviceBannerLeft}>
              <View style={[styles.serviceStatusDot, myServices[0].availability ? styles.statusDotActive : styles.statusDotPaused]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.serviceBannerTitle}>{myServices[0].name}</Text>
                <Text style={styles.serviceBannerSub}>
                  KES {Number(myServices[0].price).toLocaleString()} • {myServices[0].availability ? 'Accepting bookings' : 'Paused'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.toggleBtn, !myServices[0].availability && styles.toggleBtnActive]}
              onPress={handleToggleAvailability}
              activeOpacity={0.8}
            >
              <Ionicons
                name={myServices[0].availability ? 'pause-circle' : 'play-circle'}
                size={16}
                color={Colors.white}
              />
              <Text style={styles.toggleBtnText}>
                {myServices[0].availability ? 'Pause' : 'Go Live'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.createServiceCard}
            onPress={() => setIsCreateServiceOpen(true)}
            activeOpacity={0.8}
          >
            <View style={styles.createServiceIcon}>
              <Ionicons name="bus" size={28} color={Colors.matteClay} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.createServiceTitle}>Create Your Moving Service</Text>
              <Text style={styles.createServiceSub}>
                Set up your mover profile so clients can find and book you for local hauling gigs.
              </Text>
            </View>
            <Ionicons name="arrow-forward-circle" size={28} color={Colors.matteClay} />
          </TouchableOpacity>
        )}

        <FilterTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

        {filteredJobs.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="bus-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>
              {activeTab === 0 ? 'No Open Gigs Available' : 'No Accepted Gigs Yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 0
                ? hasActiveService
                  ? 'New local relocation requests from clients moving in across Nairobi will appear here.'
                  : 'Create your moving service first so clients can book you for hauling gigs.'
                : 'Jobs you accept from the "Open Moving Gigs" tab will be managed here.'}
            </Text>
            {activeTab === 0 && !hasActiveService && (
              <TouchableOpacity
                style={styles.emptyActionBtn}
                onPress={() => setIsCreateServiceOpen(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle" size={18} color={Colors.white} />
                <Text style={styles.emptyActionBtnText}>Create Moving Service</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredJobs.map((job) => {
            const isAccepted = job.status !== 'Open';

            return (
              <View key={job.id} style={styles.jobCard}>
                {/* Header Row */}
                <View style={styles.cardHeader}>
                  <View style={styles.clientRow}>
                    <Image source={{ uri: job.client_avatar }} style={styles.avatar} contentFit="cover" />
                    <View>
                      <Text style={styles.clientName}>{job.client_name}</Text>
                      <Text style={styles.moveDetails}>{job.cargo_description}</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.feeText}>KES {job.fee.toLocaleString()}</Text>
                    <Text style={styles.feeSub}>Guaranteed Escrow Fee</Text>
                  </View>
                </View>

                {/* Move-In Date & Distance Banner */}
                <View style={styles.infoBanner}>
                  <View style={styles.infoChip}>
                    <Ionicons name="calendar-outline" size={14} color={Colors.matteClay} />
                    <Text style={styles.infoChipText}>{job.move_in_date} ({job.move_in_time})</Text>
                  </View>
                  <View style={styles.infoChip}>
                    <Ionicons name="speedometer-outline" size={14} color={Colors.deepCocoa} />
                    <Text style={styles.infoChipText}>{job.distance_km} km ({job.est_duration_mins} mins)</Text>
                  </View>
                </View>

                {/* GPS Route Overview */}
                <View style={styles.routeContainer}>
                  <View style={styles.routeRow}>
                    <View style={styles.dotOrigin} />
                    <Text style={styles.routeText}>Pickup: {job.from_address}</Text>
                  </View>
                  <View style={styles.routeLine} />
                  <View style={styles.routeRow}>
                    <View style={styles.dotDest} />
                    <Text style={styles.routeText}>Move-In Destination: {job.to_address}</Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.cardActions}>
                  {activeTab === 0 ? (
                    <TouchableOpacity
                      style={styles.acceptBtn}
                      onPress={() => handleAccept(job)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="checkmark-circle-outline" size={18} color={Colors.white} />
                      <Text style={styles.acceptBtnText}>Accept Local Hauling Gig</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.gpsBtn}
                      onPress={() => handleOpenGpsRoute(job)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="navigate" size={18} color={Colors.white} />
                      <Text style={styles.gpsBtnText}>Open GPS Navigation Route</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* GPS NAVIGATION OVERLAY MODAL */}
      <Modal visible={isGpsModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>GPS Coordination Navigation</Text>
              <TouchableOpacity onPress={() => setIsGpsModalOpen(false)}>
                <Ionicons name="close" size={24} color={Colors.deepCocoa} />
              </TouchableOpacity>
            </View>

            {/* Map Preview Box */}
            <View style={styles.mapPreviewBox}>
              <Ionicons name="map" size={42} color={Colors.matteClay} />
              <Text style={styles.mapTitle}>Live GPS Route Guided Navigation</Text>
              <Text style={styles.mapCoords}>
                Pickup Coords: ({selectedGpsJob?.pickup_lat}, {selectedGpsJob?.pickup_lng})
              </Text>
              <Text style={styles.mapCoords}>
                Destination Coords: ({selectedGpsJob?.dropoff_lat}, {selectedGpsJob?.dropoff_lng})
              </Text>
              <View style={styles.etaBadge}>
                <Ionicons name="compass" size={16} color={Colors.white} />
                <Text style={styles.etaBadgeText}>
                  {selectedGpsJob?.distance_km} km • Estimated {selectedGpsJob?.est_duration_mins} mins via Thika/Waiyaki Way
                </Text>
              </View>
            </View>

            <View style={styles.navDetailCard}>
              <Text style={styles.navDetailTitle}>Client Destination Address</Text>
              <Text style={styles.navDetailText}>{selectedGpsJob?.to_address}</Text>

              <Text style={[styles.navDetailTitle, { marginTop: Spacing.sm }]}>Client Contact</Text>
              <Text style={styles.navDetailText}>
                {selectedGpsJob?.client_name} ({selectedGpsJob?.client_phone})
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeGpsBtn}
              onPress={() => {
                if (!selectedGpsJob?.to_address) return;
                Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedGpsJob.to_address)}`);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.closeGpsBtnText}>Open Destination in Maps</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* CREATE MOVING SERVICE MODAL */}
      <Modal visible={isCreateServiceOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Moving Service</Text>
              <TouchableOpacity onPress={() => setIsCreateServiceOpen(false)}>
                <Ionicons name="close" size={24} color={Colors.deepCocoa} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.createModalHint}>
                <Ionicons name="information-circle-outline" size={18} color={Colors.matteClay} />
                <Text style={styles.createModalHintText}>
                  This will publish your moving service so clients can find and book you for local hauling and relocation gigs.
                </Text>
              </View>

              <Text style={styles.inputLabel}>Service Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Swift Nairobi Movers"
                placeholderTextColor={Colors.textTertiary}
                value={serviceName}
                onChangeText={setServiceName}
              />

              <Text style={styles.inputLabel}>Base Price (KES)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 5000"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="number-pad"
                value={servicePrice}
                onChangeText={setServicePrice}
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, { height: 100, textAlignVertical: 'top' }]}
                placeholder="Describe what your moving service includes — e.g. truck size, coverage area, packing support, number of movers..."
                placeholderTextColor={Colors.textTertiary}
                multiline
                value={serviceDescription}
                onChangeText={setServiceDescription}
              />

              <TouchableOpacity
                style={styles.publishBtn}
                onPress={handleCreateService}
                activeOpacity={0.8}
              >
                <Ionicons name="rocket" size={18} color={Colors.white} />
                <Text style={styles.publishBtnText}>Publish Moving Service</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.softCream },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  title: { fontSize: Typography.h1, fontWeight: Typography.bold, color: Colors.deepCocoa },
  subtitle: { fontSize: Typography.bodySmall, color: Colors.textSecondary, marginTop: 2 },

  // Service Banner (when service exists)
  serviceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.badgeSuccess,
    ...Shadows.card,
  },
  serviceBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  serviceStatusDot: { width: 10, height: 10, borderRadius: 5 },
  statusDotActive: { backgroundColor: Colors.badgeSuccess },
  statusDotPaused: { backgroundColor: Colors.textTertiary },
  serviceBannerTitle: { fontSize: Typography.bodySmall, fontWeight: Typography.bold, color: Colors.deepCocoa },
  serviceBannerSub: { fontSize: Typography.caption, color: Colors.textSecondary, marginTop: 1 },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.textSecondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.pill,
  },
  toggleBtnActive: { backgroundColor: Colors.badgeSuccess },
  toggleBtnText: { color: Colors.white, fontSize: Typography.caption, fontWeight: Typography.bold },

  // Create Service Card (when no service exists)
  createServiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.matteClay,
    borderStyle: 'dashed',
    ...Shadows.card,
  },
  createServiceIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F5EDE4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createServiceTitle: { fontSize: Typography.body, fontWeight: Typography.bold, color: Colors.deepCocoa },
  createServiceSub: { fontSize: Typography.caption, color: Colors.textSecondary, marginTop: 2, lineHeight: 18 },

  // Empty state
  emptyCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  emptyTitle: { fontSize: Typography.h3, fontWeight: Typography.bold, color: Colors.deepCocoa, marginTop: Spacing.sm },
  emptySubtitle: { fontSize: Typography.bodySmall, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs, lineHeight: 20 },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.matteClay,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.pill,
    marginTop: Spacing.md,
  },
  emptyActionBtnText: { color: Colors.white, fontSize: Typography.bodySmall, fontWeight: Typography.bold },

  // Job cards
  jobCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  clientRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  clientName: { fontSize: Typography.bodySmall, fontWeight: Typography.bold, color: Colors.deepCocoa },
  moveDetails: { fontSize: Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  feeText: { fontSize: Typography.body, fontWeight: Typography.bold, color: Colors.matteClay },
  feeSub: { fontSize: Typography.tiny, color: Colors.textTertiary, marginTop: 1 },
  infoBanner: { flexDirection: 'row', gap: Spacing.xs, marginVertical: Spacing.md },
  infoChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.softCream, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.pill },
  infoChipText: { fontSize: Typography.caption, fontWeight: Typography.semiBold, color: Colors.deepCocoa },
  routeContainer: { backgroundColor: '#FAF7F2', borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.md },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  dotOrigin: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.matteClay },
  dotDest: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.badgeSuccess },
  routeLine: { width: 2, height: 12, backgroundColor: Colors.divider, marginLeft: 4, marginVertical: 2 },
  routeText: { fontSize: Typography.bodySmall, color: Colors.deepCocoa, flex: 1 },
  cardActions: { marginTop: Spacing.xs },
  acceptBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.matteClay, borderRadius: BorderRadius.pill, paddingVertical: Spacing.md },
  acceptBtnText: { color: Colors.white, fontSize: Typography.bodySmall, fontWeight: Typography.bold },
  gpsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.deepCocoa, borderRadius: BorderRadius.pill, paddingVertical: Spacing.md },
  gpsBtnText: { color: Colors.white, fontSize: Typography.bodySmall, fontWeight: Typography.bold },

  // GPS modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.xl, maxHeight: '88%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  modalTitle: { fontSize: Typography.h3, fontWeight: Typography.bold, color: Colors.deepCocoa },
  mapPreviewBox: { backgroundColor: '#F3F4F6', borderRadius: BorderRadius.lg, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.md },
  mapTitle: { fontSize: Typography.body, fontWeight: Typography.bold, color: Colors.deepCocoa, marginTop: Spacing.xs },
  mapCoords: { fontSize: Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  etaBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.badgeVerified, paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: BorderRadius.pill, marginTop: Spacing.md },
  etaBadgeText: { color: Colors.white, fontSize: Typography.caption, fontWeight: Typography.bold },
  navDetailCard: { backgroundColor: Colors.softCream, padding: Spacing.md, borderRadius: BorderRadius.md, marginBottom: Spacing.md },
  navDetailTitle: { fontSize: Typography.caption, fontWeight: Typography.bold, color: Colors.textSecondary },
  navDetailText: { fontSize: Typography.bodySmall, color: Colors.deepCocoa, marginTop: 2 },
  closeGpsBtn: { backgroundColor: Colors.matteClay, borderRadius: BorderRadius.pill, paddingVertical: Spacing.md, alignItems: 'center' },
  closeGpsBtnText: { color: Colors.white, fontSize: Typography.bodySmall, fontWeight: Typography.bold },

  // Create Service modal
  createModalHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: '#F5EDE4',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  createModalHintText: { fontSize: Typography.caption, color: Colors.deepCocoa, flex: 1, lineHeight: 18 },
  inputLabel: { fontSize: Typography.bodySmall, fontWeight: Typography.semiBold, color: Colors.deepCocoa, marginBottom: Spacing.xs, marginTop: Spacing.xs },
  textInput: { backgroundColor: Colors.softCream, borderRadius: BorderRadius.md, padding: Spacing.md, fontSize: Typography.bodySmall, color: Colors.deepCocoa, marginBottom: Spacing.sm },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.matteClay,
    borderRadius: BorderRadius.pill,
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  publishBtnText: { color: Colors.white, fontSize: Typography.body, fontWeight: Typography.bold },
});
