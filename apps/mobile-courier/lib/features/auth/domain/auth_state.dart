import 'courier_user.dart';

enum AuthProvider {
  google('google', 'Google'),
  microsoft('microsoft', 'Microsoft'),
  apple('apple', 'Apple'),
  facebook('facebook', 'Facebook');

  const AuthProvider(this.path, this.label);

  final String path;
  final String label;
}

sealed class AuthState {
  const AuthState();

  bool get isAuthenticated => this is Authenticated;
}

final class Unauthenticated extends AuthState {
  const Unauthenticated();
}

final class Authenticated extends AuthState {
  const Authenticated(this.user);

  final CourierUser user;
}
