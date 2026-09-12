import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'data/courier_directory_repository.dart';
import 'domain/courier_profile.dart';

final courierProfileProvider = FutureProvider.autoDispose.family<CourierProfile, String>(
  (ref, courierId) => ref.watch(courierDirectoryRepositoryProvider).profile(courierId),
);

final courierReviewsProvider = FutureProvider.autoDispose.family<List<CourierReview>, String>(
  (ref, courierId) => ref.watch(courierDirectoryRepositoryProvider).reviews(courierId),
);
