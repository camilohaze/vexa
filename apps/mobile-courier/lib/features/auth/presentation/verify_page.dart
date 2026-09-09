import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router.dart';
import '../../../core/theme/vexa_colors.dart';
import '../providers.dart';
import 'widgets/auth_field.dart';

/// Verificación con código de 6 dígitos (Figma: verify-email).
/// purpose: 'verify' → verifica email y completa login.
///          'reset'  → además pide la nueva contraseña.
class VerifyCodePage extends ConsumerStatefulWidget {
  const VerifyCodePage({super.key, required this.email, this.purpose = 'verify'});

  final String email;
  final String purpose;

  @override
  ConsumerState<VerifyCodePage> createState() => _VerifyCodePageState();
}

class _VerifyCodePageState extends ConsumerState<VerifyCodePage> {
  final _digits = List.generate(6, (_) => TextEditingController());
  final _focus = List.generate(6, (_) => FocusNode());
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  Timer? _timer;
  int _secondsLeft = 150;
  bool _loading = false;

  bool get _isReset => widget.purpose == 'reset';

  String get _code => _digits.map((c) => c.text).join();

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (_secondsLeft <= 0) {
        t.cancel();
      } else {
        setState(() => _secondsLeft--);
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    for (final c in _digits) {
      c.dispose();
    }
    for (final f in _focus) {
      f.dispose();
    }
    _password.dispose();
    _confirm.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final mm = (_secondsLeft ~/ 60).toString().padLeft(2, '0');
    final ss = (_secondsLeft % 60).toString().padLeft(2, '0');

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          children: [
            const SizedBox(height: 48),
            Text(
              _isReset ? 'Restablecer contraseña' : 'Verifica tu correo',
              style: theme.textTheme.headlineSmall
                  ?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            Text(
              'Enviamos un código de 6 dígitos a ${widget.email}. Ingrésalo abajo.',
              style: theme.textTheme.bodyMedium
                  ?.copyWith(color: VexaColors.gray500, height: 1.5),
            ),
            const SizedBox(height: 32),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                for (var i = 0; i < 6; i++) _OtpBox(controller: _digits[i], focus: _focus[i], onChanged: (v) => _onDigit(i, v)),
              ],
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                const Icon(Icons.schedule, size: 16, color: VexaColors.gray400),
                const SizedBox(width: 6),
                Text('$mm:$ss',
                    style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: VexaColors.gray600)),
                const Spacer(),
                TextButton(
                  onPressed: _secondsLeft == 0 ? _resend : null,
                  child: const Text('Reenviar código'),
                ),
              ],
            ),
            if (_isReset) ...[
              const SizedBox(height: 16),
              AuthField(
                label: 'Nueva contraseña',
                hint: 'Mínimo 8 caracteres',
                icon: Icons.lock_outline,
                controller: _password,
                obscureText: true,
              ),
              const SizedBox(height: 16),
              AuthField(
                label: 'Confirmar contraseña',
                hint: 'Repite la contraseña',
                icon: Icons.lock_outline,
                controller: _confirm,
                obscureText: true,
              ),
            ],
            const SizedBox(height: 28),
            FilledButton(
              onPressed: _loading || _code.length < 6 ? null : _submit,
              child: _loading
                  ? const SizedBox(
                      width: 20, height: 20,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white))
                  : Text(_isReset ? 'Restablecer' : 'Verificar'),
            ),
          ],
        ),
      ),
    );
  }

  void _onDigit(int index, String value) {
    if (value.isNotEmpty && index < 5) {
      _focus[index + 1].requestFocus();
    } else if (value.isEmpty && index > 0) {
      _focus[index - 1].requestFocus();
    }
    setState(() {});
  }

  Future<void> _resend() async {
    try {
      if (_isReset) {
        await ref.read(authStateProvider.notifier).forgotPassword(widget.email);
      } else {
        await ref
            .read(authStateProvider.notifier)
            .resendVerification(widget.email);
      }
      setState(() => _secondsLeft = 150);
      _timer?.cancel();
      _timer = Timer.periodic(const Duration(seconds: 1), (t) {
        if (_secondsLeft <= 0) {
          t.cancel();
        } else {
          setState(() => _secondsLeft--);
        }
      });
    } on DioException {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('No se pudo reenviar el código')),
        );
      }
    }
  }

  Future<void> _submit() async {
    setState(() => _loading = true);
    try {
      if (_isReset) {
        if (_password.text.length < 8 || _password.text != _confirm.text) {
          throw const _InvalidPassword();
        }
        await ref.read(authStateProvider.notifier).resetPassword(
              email: widget.email,
              code: _code,
              password: _password.text,
            );
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Contraseña actualizada')),
        );
        await context.push(AppRoutes.login);
      } else {
        await ref
            .read(authStateProvider.notifier)
            .verifyEmail(email: widget.email, code: _code);
        // El router redirige a /home al autenticarse.
      }
    } on _InvalidPassword {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Revisa la nueva contraseña')),
        );
      }
    } on DioException {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Código inválido o expirado')),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }
}

class _InvalidPassword implements Exception {
  const _InvalidPassword();
}

class _OtpBox extends StatelessWidget {
  const _OtpBox({
    required this.controller,
    required this.focus,
    required this.onChanged,
  });

  final TextEditingController controller;
  final FocusNode focus;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 48,
      height: 56,
      child: TextField(
        controller: controller,
        focusNode: focus,
        textAlign: TextAlign.center,
        keyboardType: TextInputType.number,
        maxLength: 1,
        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
        style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
        decoration: const InputDecoration(
          counterText: '',
          contentPadding: EdgeInsets.zero,
        ),
        onChanged: onChanged,
      ),
    );
  }
}
