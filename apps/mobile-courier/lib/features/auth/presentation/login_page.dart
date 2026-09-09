import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router.dart';
import '../../../core/theme/vexa_colors.dart';
import '../domain/auth_state.dart';
import '../providers.dart';
import 'widgets/auth_field.dart';
import 'widgets/oauth_sheet.dart';
import 'widgets/vexa_logo.dart';

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _obscure = true;
  bool _loading = false;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            children: [
              const SizedBox(height: 48),
              const VexaLogo(size: 36),
              const SizedBox(height: 16),
              Text('Bienvenido de nuevo',
                  style: theme.textTheme.headlineSmall
                      ?.copyWith(fontWeight: FontWeight.w700)),
              const SizedBox(height: 6),
              Text('Inicia sesión para continuar tus envíos',
                  style: theme.textTheme.bodyMedium
                      ?.copyWith(color: VexaColors.gray500)),
              const SizedBox(height: 32),
              AuthField(
                label: 'Correo electrónico',
                hint: 'nombre@empresa.com',
                icon: Icons.mail_outline,
                controller: _email,
                keyboardType: TextInputType.emailAddress,
                validator: (v) => (v == null || !v.contains('@'))
                    ? 'Ingresa un correo válido'
                    : null,
              ),
              const SizedBox(height: 20),
              AuthField(
                label: 'Contraseña',
                hint: 'Ingresa tu contraseña',
                icon: Icons.lock_outline,
                controller: _password,
                obscureText: _obscure,
                validator: (v) =>
                    (v == null || v.isEmpty) ? 'Ingresa tu contraseña' : null,
                trailing: IconButton(
                  icon: Icon(
                    _obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                    size: 20,
                  ),
                  onPressed: () => setState(() => _obscure = !_obscure),
                ),
              ),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: () => context.push(AppRoutes.resetPassword),
                  child: const Text('¿Olvidaste tu contraseña?'),
                ),
              ),
              const SizedBox(height: 8),
              FilledButton(
                onPressed: _loading ? null : _submit,
                child: _loading
                    ? const SizedBox(
                        width: 20, height: 20,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white))
                    : const Text('Iniciar sesión'),
              ),
              const SizedBox(height: 28),
              const _Divider(),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: _SocialButton(
                      label: 'Google',
                      icon: Icons.g_mobiledata,
                      onPressed: () => _oauth(AuthProvider.google),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _SocialButton(
                      label: 'Apple',
                      icon: Icons.apple,
                      onPressed: () => _oauth(AuthProvider.apple),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 40),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('¿No tienes una cuenta?',
                      style: theme.textTheme.bodyMedium
                          ?.copyWith(color: VexaColors.gray500)),
                  TextButton(
                    onPressed: () => context.push(AppRoutes.register),
                    child: const Text('Crear cuenta'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      final needsVerification =
          await ref.read(authStateProvider.notifier).loginWithPassword(
                email: _email.text.trim(),
                password: _password.text,
              );
      if (!mounted) return;
      if (needsVerification) {
        await context.push(AppRoutes.verifyEmail, extra: _email.text.trim());
      }
    } on DioException {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Credenciales inválidas')),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _oauth(AuthProvider provider) async {
    final tokens = await showVexaOAuthSheet(context, ref, provider);
    if (tokens == null || !mounted) return;
    await ref.read(authStateProvider.notifier).completeLogin(
          accessToken: tokens.access,
          refreshToken: tokens.refresh,
        );
    if (!mounted) return;
    if (ref.read(authStateProvider).hasError) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No se pudo iniciar sesión')),
      );
    }
  }
}

class _Divider extends StatelessWidget {
  const _Divider();

  @override
  Widget build(BuildContext context) {
    return const Row(
      children: [
        Expanded(child: Divider()),
        Padding(
          padding: EdgeInsets.symmetric(horizontal: 12),
          child: Text('o continúa con',
              style: TextStyle(fontSize: 12, color: VexaColors.gray400)),
        ),
        Expanded(child: Divider()),
      ],
    );
  }
}

class _SocialButton extends StatelessWidget {
  const _SocialButton({required this.label, required this.icon, required this.onPressed});

  final String label;
  final IconData icon;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return OutlinedButton.icon(
      onPressed: onPressed,
      icon: Icon(icon, size: 22, color: VexaColors.gray800),
      label: Text(label),
      style: OutlinedButton.styleFrom(
        foregroundColor: VexaColors.gray800,
        side: const BorderSide(color: VexaColors.gray200),
      ),
    );
  }
}
