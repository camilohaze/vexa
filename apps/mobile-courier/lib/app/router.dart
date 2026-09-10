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

abstract final class AppRoutes {
  static const splash = '/';
  static const welcome = '/welcome';
  static const login = '/login';
  static const register = '/register';
  static const roleSelect = '/role';
  static const resetPassword = '/reset-password';
  static const verifyEmail = '/verify';
  static const resetVerify = '/reset-verify';
  static const home = '/home';
  static const profile = '/profile';
  static const notificationSettings = '/settings/notifications';
  static const help = '/help';
  static const faq = '/help/faq';
  static const terms = '/legal/terms';
  static const privacy = '/legal/privacy';
  static const rewards = '/rewards';
  static const refer = '/refer';
  static const supportChat = '/support/chat';

  static const jobBoard = '/jobs';
  static const earnings = '/earnings';
  static const withdraw = '/earnings/withdraw';
  static const wallet = '/wallet';
  static const history = '/history';
  static const performance = '/performance';
  static const ratings = '/ratings';
  static const verification = '/verification';
  static const vehicleRegistration = '/verification/vehicle';
  static const identityVerification = '/verification/identity';

  static String job(String id) => '/jobs/$id';
  static String jobChat(String id) => '/jobs/$id/chat';
  static String jobAccepted(String id) => '/jobs/$id/accepted';
  static String jobPickup(String id) => '/jobs/$id/pickup';
  static String jobDelivery(String id) => '/jobs/$id/delivery';
  static String jobProof(String id) => '/jobs/$id/proof';
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

      final authenticated = switch (auth) {
        AsyncData(value: Authenticated()) => true,
        _ => false,
      };

      const publicPaths = {
        AppRoutes.welcome,
        AppRoutes.login,
        AppRoutes.register,
        AppRoutes.roleSelect,
        AppRoutes.resetPassword,
        AppRoutes.verifyEmail,
        AppRoutes.resetVerify,
        AppRoutes.terms,
        AppRoutes.privacy,
      };
      if (!authenticated) {
        return publicPaths.contains(location) ? null : AppRoutes.welcome;
      }
      if (location == AppRoutes.splash || publicPaths.contains(location)) {
        return AppRoutes.home;
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
        path: AppRoutes.home,
        builder: (context, state) => const DashboardPage(),
      ),
      GoRoute(
        path: AppRoutes.jobBoard,
        builder: (context, state) => const JobBoardPage(),
      ),
      GoRoute(
        path: '/jobs/:id',
        builder: (context, state) =>
            JobDetailPage(jobId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/jobs/:id/chat',
        builder: (context, state) => ChatPage(jobId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/jobs/:id/accepted',
        builder: (context, state) =>
            DeliveryAcceptedPage(jobId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/jobs/:id/pickup',
        builder: (context, state) =>
            PickupConfirmationPage(jobId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/jobs/:id/delivery',
        builder: (context, state) =>
            DeliveryConfirmationPage(jobId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/jobs/:id/proof',
        builder: (context, state) =>
            ProofOfDeliveryPage(jobId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: AppRoutes.earnings,
        builder: (context, state) => const EarningsPage(),
      ),
      GoRoute(
        path: AppRoutes.withdraw,
        builder: (context, state) => const WithdrawPage(),
      ),
      GoRoute(
        path: AppRoutes.wallet,
        builder: (context, state) => const WalletPage(),
      ),
      GoRoute(
        path: AppRoutes.history,
        builder: (context, state) => const DeliveryHistoryPage(),
      ),
      GoRoute(
        path: AppRoutes.performance,
        builder: (context, state) => const PerformancePage(),
      ),
      GoRoute(
        path: AppRoutes.ratings,
        builder: (context, state) => const RatingsPage(),
      ),
      GoRoute(
        path: AppRoutes.verification,
        builder: (context, state) => const VerificationPage(),
      ),
      GoRoute(
        path: AppRoutes.vehicleRegistration,
        builder: (context, state) => const VehicleRegistrationPage(),
      ),
      GoRoute(
        path: AppRoutes.identityVerification,
        builder: (context, state) => const IdentityVerificationPage(),
      ),
      GoRoute(
        path: AppRoutes.profile,
        builder: (context, state) => const ProfilePage(),
      ),
      GoRoute(
        path: AppRoutes.notificationSettings,
        builder: (context, state) => const NotificationSettingsPage(),
      ),
      GoRoute(
        path: AppRoutes.help,
        builder: (context, state) => const HelpCenterPage(),
      ),
      GoRoute(
        path: AppRoutes.faq,
        builder: (context, state) => const FaqPage(),
      ),
      GoRoute(
        path: AppRoutes.terms,
        builder: (context, state) => const TermsPage(),
      ),
      GoRoute(
        path: AppRoutes.privacy,
        builder: (context, state) => const PrivacyPage(),
      ),
      GoRoute(
        path: AppRoutes.rewards,
        builder: (context, state) => const RewardsPage(),
      ),
      GoRoute(
        path: AppRoutes.refer,
        builder: (context, state) => const ReferEarnPage(),
      ),
      GoRoute(
        path: AppRoutes.supportChat,
        builder: (context, state) =>
            const ChatPage(jobId: 'support', peerName: 'Soporte Vexa'),
      ),
    ],
  );
});
