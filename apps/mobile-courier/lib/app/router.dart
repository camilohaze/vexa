import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/auth/domain/auth_state.dart';
import '../features/auth/presentation/login_page.dart';
import '../features/auth/presentation/register_page.dart';
import '../features/auth/presentation/reset_password_page.dart';
import '../features/auth/presentation/role_select_page.dart';
import '../features/auth/presentation/splash_page.dart';
import '../features/auth/presentation/verify_page.dart';
import '../features/auth/presentation/welcome_page.dart';
import '../features/auth/providers.dart';
import '../features/chat/presentation/chat_page.dart';
import '../features/couriers/presentation/courier_profile_view_page.dart';
import '../features/couriers/presentation/courier_rating_page.dart';
import '../features/dashboard/presentation/company_dashboard_page.dart';
import '../features/deliveries/presentation/company_job_detail_page.dart';
import '../features/deliveries/presentation/company_jobs_list_page.dart';
import '../features/deliveries/presentation/company_track_page.dart';
import '../features/deliveries/presentation/delivery_history_page.dart' as company;
import '../features/deliveries/presentation/delivery_tracking_page.dart';
import '../features/deliveries/presentation/job_create/create_delivery_request_page.dart';
import '../features/deliveries/presentation/job_create/delivery_details_form_page.dart';
import '../features/deliveries/presentation/job_create/destination_location_page.dart';
import '../features/deliveries/presentation/job_create/pickup_location_page.dart';
import '../features/deliveries/presentation/job_create/price_offer_page.dart';
import '../features/deliveries/presentation/job_create/publish_delivery_page.dart';
import '../features/inbox/presentation/notifications_screen_page.dart';
import '../features/settings/presentation/company_settings_page.dart';
import '../features/wallet/presentation/invoices_page.dart';
import '../features/wallet/presentation/payment_methods_page.dart';
import '../features/wallet/presentation/wallet_page.dart' as company;
import '../features/earnings/presentation/earnings_page.dart';
import '../features/earnings/presentation/performance_page.dart';
import '../features/earnings/presentation/ratings_page.dart';
import '../features/earnings/presentation/wallet_page.dart';
import '../features/earnings/presentation/withdraw_page.dart';
import '../features/home/presentation/dashboard_page.dart';
import '../features/jobs/presentation/delivery_accepted_page.dart';
import '../features/jobs/presentation/delivery_confirmation_page.dart';
import '../features/jobs/presentation/delivery_history_page.dart';
import '../features/jobs/presentation/job_board_page.dart';
import '../features/jobs/presentation/job_detail_page.dart';
import '../features/jobs/presentation/pickup_confirmation_page.dart';
import '../features/jobs/presentation/proof_of_delivery_page.dart';
import '../features/notifications/presentation/notification_settings_page.dart';
import '../features/profile/presentation/profile_page.dart';
import '../features/rewards/presentation/refer_page.dart';
import '../features/rewards/presentation/rewards_page.dart';
import '../features/support/presentation/faq_page.dart';
import '../features/support/presentation/help_center_page.dart';
import '../features/support/presentation/legal_page.dart';
import '../features/verification/presentation/identity_verification_page.dart';
import '../features/verification/presentation/vehicle_registration_page.dart';
import '../features/verification/presentation/verification_page.dart';

/// Rutas con prefijo por rol (`/courier/*`, `/company/*`) para que nunca
/// colisionen entre los dos roles que soporta la app. Las rutas previas al
/// login (auth, legal) son compartidas y no llevan prefijo.
abstract final class AppRoutes {
  static const splash = '/';
  static const welcome = '/welcome';
  static const login = '/login';
  static const register = '/register';
  static const roleSelect = '/role';
  static const resetPassword = '/reset-password';
  static const verifyEmail = '/verify';
  static const resetVerify = '/reset-verify';
  static const terms = '/legal/terms';
  static const privacy = '/legal/privacy';

  // --- Courier ---
  static const courierHome = '/courier/home';
  static const courierProfile = '/courier/profile';
  static const courierNotificationSettings = '/courier/settings/notifications';
  static const courierHelp = '/courier/help';
  static const courierFaq = '/courier/help/faq';
  static const courierRewards = '/courier/rewards';
  static const courierRefer = '/courier/refer';
  static const courierSupportChat = '/courier/support/chat';
  static const courierJobBoard = '/courier/jobs';
  static const courierEarnings = '/courier/earnings';
  static const courierWithdraw = '/courier/earnings/withdraw';
  static const courierWallet = '/courier/wallet';
  static const courierHistory = '/courier/history';
  static const courierPerformance = '/courier/performance';
  static const courierRatings = '/courier/ratings';
  static const courierVerification = '/courier/verification';
  static const courierVehicleRegistration = '/courier/verification/vehicle';
  static const courierIdentityVerification = '/courier/verification/identity';

  static String courierJob(String id) => '/courier/jobs/$id';
  static String courierJobChat(String id) => '/courier/jobs/$id/chat';
  static String courierJobAccepted(String id) => '/courier/jobs/$id/accepted';
  static String courierJobPickup(String id) => '/courier/jobs/$id/pickup';
  static String courierJobDelivery(String id) => '/courier/jobs/$id/delivery';
  static String courierJobProof(String id) => '/courier/jobs/$id/proof';

  // --- Company ---
  static const companyHome = '/company/home';
  static const companyJobs = '/company/jobs';
  static const companyJobCreate = '/company/jobs/new';
  static const companyJobCreateDetails = '/company/jobs/new/details';
  static const companyJobCreatePickup = '/company/jobs/new/pickup';
  static const companyJobCreateDestination = '/company/jobs/new/destination';
  static const companyJobCreatePrice = '/company/jobs/new/price';
  static const companyJobCreateReview = '/company/jobs/new/review';
  static const companyHistory = '/company/history';
  static const companyTrack = '/company/track';
  static const companyWallet = '/company/wallet';
  static const companyPaymentMethods = '/company/wallet/payment-methods';
  static const companyInvoices = '/company/invoices';
  static const companyNotifications = '/company/notifications';
  static const companySettings = '/company/settings';

  static String companyJob(String id) => '/company/jobs/$id';
  static String companyJobChat(String id) => '/company/jobs/$id/chat';
  static String companyJobRate(String id) => '/company/jobs/$id/rate';
  static String companyTrackJob(String id) => '/company/track/$id';
  static String companyCourier(String id) => '/company/couriers/$id';
}

class _RouterRefresh extends ChangeNotifier {
  void refresh() => notifyListeners();
}

final routerProvider = Provider<GoRouter>((ref) {
  final refresh = _RouterRefresh();
  ref.listen(authStateProvider, (previous, next) => refresh.refresh());
  ref.onDispose(refresh.dispose);

  return GoRouter(
    initialLocation: AppRoutes.splash,
    refreshListenable: refresh,
    redirect: (context, state) {
      final auth = ref.read(authStateProvider);
      final location = state.matchedLocation;

      if (auth.isLoading && !auth.hasValue) {
        return location == AppRoutes.splash ? null : AppRoutes.splash;
      }

      final user = switch (auth) {
        AsyncData(value: Authenticated(:final user)) => user,
        _ => null,
      };

      const authOnlyPaths = {
        AppRoutes.welcome,
        AppRoutes.login,
        AppRoutes.register,
        AppRoutes.roleSelect,
        AppRoutes.resetPassword,
        AppRoutes.verifyEmail,
        AppRoutes.resetVerify,
      };
      // Términos y privacidad son consultables con o sin sesión activa.
      const legalPaths = {AppRoutes.terms, AppRoutes.privacy};
      if (user == null) {
        return authOnlyPaths.contains(location) || legalPaths.contains(location)
            ? null
            : AppRoutes.welcome;
      }

      final home = user.isCompany ? AppRoutes.companyHome : AppRoutes.courierHome;
      if (location == AppRoutes.splash || authOnlyPaths.contains(location)) {
        return home;
      }
      if (legalPaths.contains(location)) {
        return null;
      }
      // Cada rol queda confinado a su propio prefijo de rutas.
      final ownPrefix = user.isCompany ? '/company' : '/courier';
      if (!location.startsWith(ownPrefix)) {
        return home;
      }
      return null;
    },
    routes: [
      GoRoute(
        path: AppRoutes.splash,
        builder: (context, state) => const SplashPage(),
      ),
      GoRoute(
        path: AppRoutes.welcome,
        builder: (context, state) => const WelcomePage(),
      ),
      GoRoute(
        path: AppRoutes.login,
        builder: (context, state) => const LoginPage(),
      ),
      GoRoute(
        path: AppRoutes.register,
        builder: (context, state) => RegisterPage(
          role: state.extra is String ? state.extra as String : 'COURIER',
        ),
      ),
      GoRoute(
        path: AppRoutes.roleSelect,
        builder: (context, state) => const RoleSelectPage(),
      ),
      GoRoute(
        path: AppRoutes.resetPassword,
        builder: (context, state) => const ResetPasswordPage(),
      ),
      GoRoute(
        path: AppRoutes.verifyEmail,
        builder: (context, state) => VerifyCodePage(
          email: state.extra is String ? state.extra as String : '',
        ),
      ),
      GoRoute(
        path: AppRoutes.resetVerify,
        builder: (context, state) => VerifyCodePage(
          email: state.extra is String ? state.extra as String : '',
          purpose: 'reset',
        ),
      ),
      GoRoute(
        path: AppRoutes.terms,
        builder: (context, state) => const TermsPage(),
      ),
      GoRoute(
        path: AppRoutes.privacy,
        builder: (context, state) => const PrivacyPage(),
      ),

      // --- Courier ---
      GoRoute(
        path: AppRoutes.courierHome,
        builder: (context, state) => const DashboardPage(),
      ),
      GoRoute(
        path: AppRoutes.courierJobBoard,
        builder: (context, state) => const JobBoardPage(),
      ),
      GoRoute(
        path: '/courier/jobs/:id',
        builder: (context, state) =>
            JobDetailPage(jobId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/courier/jobs/:id/chat',
        builder: (context, state) => ChatPage(jobId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/courier/jobs/:id/accepted',
        builder: (context, state) =>
            DeliveryAcceptedPage(jobId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/courier/jobs/:id/pickup',
        builder: (context, state) =>
            PickupConfirmationPage(jobId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/courier/jobs/:id/delivery',
        builder: (context, state) =>
            DeliveryConfirmationPage(jobId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/courier/jobs/:id/proof',
        builder: (context, state) =>
            ProofOfDeliveryPage(jobId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: AppRoutes.courierEarnings,
        builder: (context, state) => const EarningsPage(),
      ),
      GoRoute(
        path: AppRoutes.courierWithdraw,
        builder: (context, state) => const WithdrawPage(),
      ),
      GoRoute(
        path: AppRoutes.courierWallet,
        builder: (context, state) => const WalletPage(),
      ),
      GoRoute(
        path: AppRoutes.courierHistory,
        builder: (context, state) => const DeliveryHistoryPage(),
      ),
      GoRoute(
        path: AppRoutes.courierPerformance,
        builder: (context, state) => const PerformancePage(),
      ),
      GoRoute(
        path: AppRoutes.courierRatings,
        builder: (context, state) => const RatingsPage(),
      ),
      GoRoute(
        path: AppRoutes.courierVerification,
        builder: (context, state) => const VerificationPage(),
      ),
      GoRoute(
        path: AppRoutes.courierVehicleRegistration,
        builder: (context, state) => const VehicleRegistrationPage(),
      ),
      GoRoute(
        path: AppRoutes.courierIdentityVerification,
        builder: (context, state) => const IdentityVerificationPage(),
      ),
      GoRoute(
        path: AppRoutes.courierProfile,
        builder: (context, state) => const ProfilePage(),
      ),
      GoRoute(
        path: AppRoutes.courierNotificationSettings,
        builder: (context, state) => const NotificationSettingsPage(),
      ),
      GoRoute(
        path: AppRoutes.courierHelp,
        builder: (context, state) => const HelpCenterPage(),
      ),
      GoRoute(
        path: AppRoutes.courierFaq,
        builder: (context, state) => const FaqPage(),
      ),
      GoRoute(
        path: AppRoutes.courierRewards,
        builder: (context, state) => const RewardsPage(),
      ),
      GoRoute(
        path: AppRoutes.courierRefer,
        builder: (context, state) => const ReferEarnPage(),
      ),
      GoRoute(
        path: AppRoutes.courierSupportChat,
        builder: (context, state) => const ChatPage(
          jobId: 'support',
          peerName: 'Soporte Vexa',
          subtitle: 'Atención al repartidor',
        ),
      ),

      // --- Company ---
      GoRoute(
        path: AppRoutes.companyHome,
        builder: (context, state) => const CompanyDashboardPage(),
      ),
      GoRoute(
        path: AppRoutes.companyJobs,
        builder: (context, state) => const CompanyJobsListPage(),
      ),
      GoRoute(
        path: AppRoutes.companyJobCreate,
        builder: (context, state) => const CreateDeliveryRequestPage(),
      ),
      GoRoute(
        path: AppRoutes.companyJobCreateDetails,
        builder: (context, state) => const DeliveryDetailsFormPage(),
      ),
      GoRoute(
        path: AppRoutes.companyJobCreatePickup,
        builder: (context, state) => const PickupLocationPage(),
      ),
      GoRoute(
        path: AppRoutes.companyJobCreateDestination,
        builder: (context, state) => const DestinationLocationPage(),
      ),
      GoRoute(
        path: AppRoutes.companyJobCreatePrice,
        builder: (context, state) => const PriceOfferPage(),
      ),
      GoRoute(
        path: AppRoutes.companyJobCreateReview,
        builder: (context, state) => const PublishDeliveryPage(),
      ),
      GoRoute(
        path: '/company/jobs/:id',
        builder: (context, state) =>
            CompanyJobDetailPage(jobId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/company/jobs/:id/chat',
        builder: (context, state) => ChatPage(jobId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/company/jobs/:id/rate',
        builder: (context, state) =>
            CourierRatingPage(jobId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: AppRoutes.companyHistory,
        builder: (context, state) => const company.DeliveryHistoryPage(),
      ),
      GoRoute(
        path: AppRoutes.companyTrack,
        builder: (context, state) => const CompanyTrackPage(),
      ),
      GoRoute(
        path: '/company/track/:id',
        builder: (context, state) =>
            DeliveryTrackingPage(jobId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/company/couriers/:id',
        builder: (context, state) => CourierProfileViewPage(
          courierId: state.pathParameters['id']!,
          jobId: state.uri.queryParameters['jobId'],
        ),
      ),
      GoRoute(
        path: AppRoutes.companyWallet,
        builder: (context, state) => const company.WalletPage(),
      ),
      GoRoute(
        path: AppRoutes.companyPaymentMethods,
        builder: (context, state) => const PaymentMethodsPage(),
      ),
      GoRoute(
        path: AppRoutes.companyInvoices,
        builder: (context, state) => const InvoicesPage(),
      ),
      GoRoute(
        path: AppRoutes.companyNotifications,
        builder: (context, state) => const NotificationsScreenPage(),
      ),
      GoRoute(
        path: AppRoutes.companySettings,
        builder: (context, state) => const CompanySettingsPage(),
      ),
    ],
  );
});
