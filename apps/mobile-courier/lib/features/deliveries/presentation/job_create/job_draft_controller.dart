import 'package:flutter_riverpod/flutter_riverpod.dart';

class JobDraft {
  const JobDraft({
    this.packageType = 'small',
    this.weightKg,
    this.fragile = false,
    this.refrigerated = false,
    this.description = '',
    this.dimL,
    this.dimW,
    this.dimH,
    this.priority = 'standard',
    this.pickupAt,
    this.additionalNotes = '',
    this.pickupLine1 = '',
    this.pickupCity = '',
    this.pickupState = '',
    this.pickupLat,
    this.pickupLng,
    this.pickupContactName = '',
    this.pickupContactPhone = '',
    this.dropoffLine1 = '',
    this.dropoffCity = '',
    this.dropoffState = '',
    this.dropoffLat,
    this.dropoffLng,
    this.dropoffContactName = '',
    this.dropoffContactPhone = '',
    this.deliveryInstructions = '',
    this.estimate,
    this.offeredPrice,
    this.acceptTerms = false,
  });

  final String packageType;
  final double? weightKg;
  final bool fragile;
  final bool refrigerated;
  final String description;
  final double? dimL;
  final double? dimW;
  final double? dimH;
  final String priority;
  final DateTime? pickupAt;
  final String additionalNotes;

  final String pickupLine1;
  final String pickupCity;
  final String pickupState;
  final double? pickupLat;
  final double? pickupLng;
  final String pickupContactName;
  final String pickupContactPhone;

  final String dropoffLine1;
  final String dropoffCity;
  final String dropoffState;
  final double? dropoffLat;
  final double? dropoffLng;
  final String dropoffContactName;
  final String dropoffContactPhone;
  final String deliveryInstructions;

  final Map<String, dynamic>? estimate;
  final double? offeredPrice;
  final bool acceptTerms;

  bool get hasPickup => pickupLat != null && pickupLng != null;
  bool get hasDropoff => dropoffLat != null && dropoffLng != null;

  String get packageLabel => switch (packageType) {
        'document' => 'Documento',
        'large' => 'Paquete grande',
        'pallet' => 'Pallet',
        _ => 'Paquete pequeño',
      };

  String get priorityLabel => switch (priority) {
        'express' => 'Express',
        'same_day' => 'Mismo día',
        _ => 'Estándar',
      };

  JobDraft copyWith({
    String? packageType,
    double? weightKg,
    bool? fragile,
    bool? refrigerated,
    String? description,
    double? dimL,
    double? dimW,
    double? dimH,
    String? priority,
    DateTime? pickupAt,
    String? additionalNotes,
    String? pickupLine1,
    String? pickupCity,
    String? pickupState,
    double? pickupLat,
    double? pickupLng,
    String? pickupContactName,
    String? pickupContactPhone,
    String? dropoffLine1,
    String? dropoffCity,
    String? dropoffState,
    double? dropoffLat,
    double? dropoffLng,
    String? dropoffContactName,
    String? dropoffContactPhone,
    String? deliveryInstructions,
    Map<String, dynamic>? estimate,
    double? offeredPrice,
    bool? acceptTerms,
  }) =>
      JobDraft(
        packageType: packageType ?? this.packageType,
        weightKg: weightKg ?? this.weightKg,
        fragile: fragile ?? this.fragile,
        refrigerated: refrigerated ?? this.refrigerated,
        description: description ?? this.description,
        dimL: dimL ?? this.dimL,
        dimW: dimW ?? this.dimW,
        dimH: dimH ?? this.dimH,
        priority: priority ?? this.priority,
        pickupAt: pickupAt ?? this.pickupAt,
        additionalNotes: additionalNotes ?? this.additionalNotes,
        pickupLine1: pickupLine1 ?? this.pickupLine1,
        pickupCity: pickupCity ?? this.pickupCity,
        pickupState: pickupState ?? this.pickupState,
        pickupLat: pickupLat ?? this.pickupLat,
        pickupLng: pickupLng ?? this.pickupLng,
        pickupContactName: pickupContactName ?? this.pickupContactName,
        pickupContactPhone: pickupContactPhone ?? this.pickupContactPhone,
        dropoffLine1: dropoffLine1 ?? this.dropoffLine1,
        dropoffCity: dropoffCity ?? this.dropoffCity,
        dropoffState: dropoffState ?? this.dropoffState,
        dropoffLat: dropoffLat ?? this.dropoffLat,
        dropoffLng: dropoffLng ?? this.dropoffLng,
        dropoffContactName: dropoffContactName ?? this.dropoffContactName,
        dropoffContactPhone: dropoffContactPhone ?? this.dropoffContactPhone,
        deliveryInstructions: deliveryInstructions ?? this.deliveryInstructions,
        estimate: estimate ?? this.estimate,
        offeredPrice: offeredPrice ?? this.offeredPrice,
        acceptTerms: acceptTerms ?? this.acceptTerms,
      );
}

/// Estado compartido entre las 6 pantallas del flujo "Nuevo envío"
/// (create-delivery-request → publish-delivery, Figma company mobile).
class JobDraftNotifier extends StateNotifier<JobDraft> {
  JobDraftNotifier() : super(const JobDraft());

  void update(JobDraft Function(JobDraft draft) updater) => state = updater(state);

  void reset() => state = const JobDraft();
}

final jobDraftProvider = StateNotifierProvider<JobDraftNotifier, JobDraft>(
  (ref) => JobDraftNotifier(),
);
