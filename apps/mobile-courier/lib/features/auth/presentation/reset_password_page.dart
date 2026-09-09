import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router.dart';
import '../../../core/theme/vexa_colors.dart';
import '../providers.dart';
import 'widgets/auth_field.dart';

/// Paso 1 de recuperación (Figma: Reset Password).
/// Tras enviar el código navega a /verify con propósito 'reset'.
class ResetPasswordPage extends ConsumerStatefulWidget {
  const ResetPasswordPage({super.key});

  @override
  ConsumerState<ResetPasswordPage> createState() => _ResetPasswordPageState();
}

class _ResetPasswordPageState extends ConsumerState<ResetPasswordPage> {
  final _email = TextEditingController();
  bool _loading = false;

  @override
  void dispose() {
    _email.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          children: [
            const SizedBox(height: 48),
            const _ResetIcon(),
            const SizedBox(height: 32),
            Text('Restablecer contraseña',
                style: theme.textTheme.headlineSmall
                    ?.copyWith(fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            Text(
              'Ingresa tu correo y te enviaremos un código para recuperar el acceso a tu cuenta.',
              style: theme.textTheme.bodyMedium
                  ?.copyWith(color: VexaColors.gray500, height: 1.5),
            ),
            const SizedBox(height: 32),
            AuthField(
              label: 'Correo electrónico',
              hint: 'correo@registrado.com',
              icon: Icons.mail_outline,
              controller: _email,
              keyboardType: TextInputType.emailAddress,
            ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: _loading ? null : _submit,
              child: _loading
                  ? const SizedBox(
                      width: 20, height: 20,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white))
                  : const Text('Enviar código'),
            ),
            const SizedBox(height: 16),
            Center(
              child: TextButton.icon(
                onPressed: () => context.pop(),
                icon: const Icon(Icons.arrow_back, size: 16),
                label: const Text('Volver al inicio de sesión'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submit() async {
    final email = _email.text.trim();
    if (!email.contains('@')) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Ingresa un correo válido')),
      );
      return;
    }
    setState(() => _loading = true);
    try {
      await ref.read(authStateProvider.notifier).forgotPassword(email);
      if (!mounted) return;
      await context.push(AppRoutes.resetVerify, extra: email);
    } on DioException {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No se pudo enviar el código')),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }
}

class _ResetIcon extends StatelessWidget {
  const _ResetIcon();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 96,
      height: 96,
      decoration: const BoxDecoration(
        color: VexaColors.primary50,
        shape: BoxShape.circle,
      ),
      child: const Icon(Icons.lock_reset, size: 40, color: VexaColors.primary600),
    );
  }
}
