import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'data/company_settings_repository.dart';
import 'domain/company_profile.dart';

final companyProfileProvider = FutureProvider<CompanyProfile>(
  (ref) => ref.watch(companySettingsRepositoryProvider).getMe(),
);

final companySettingsProvider = FutureProvider.autoDispose<CompanySettings>(
  (ref) => ref.watch(companySettingsRepositoryProvider).settings(),
);
