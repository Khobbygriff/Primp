import React, { useMemo } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { colors, fonts, spacing } from '../theme';

interface PaystackCheckoutProps {
    visible: boolean;
    publicKey: string;
    email: string;
    amount: number; // in subunit (pesewas), already converted server-side
    currency: string;
    reference: string;
    onSuccess: (reference: string) => void;
    onClose: () => void;
}

export default function PaystackCheckout({
                                             visible,
                                             publicKey,
                                             email,
                                             amount,
                                             currency,
                                             reference,
                                             onSuccess,
                                             onClose,
                                         }: PaystackCheckoutProps) {
    const html = useMemo(
        () => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <script src="https://js.paystack.co/v1/inline.js"></script>
        <style>
          html, body { margin: 0; padding: 0; height: 100%; background: #ffffff; }
        </style>
      </head>
      <body>
        <script>
          function post(message) {
            window.ReactNativeWebView.postMessage(JSON.stringify(message));
          }
          try {
            var handler = PaystackPop.setup({
              key: "${publicKey}",
              email: "${email}",
              amount: ${amount},
              currency: "${currency}",
              ref: "${reference}",
              callback: function(response) {
                post({ type: 'success', reference: response.reference });
              },
              onClose: function() {
                post({ type: 'closed' });
              }
            });
            handler.openIframe();
          } catch (e) {
            post({ type: 'error', message: e.message });
          }
        </script>
      </body>
    </html>
  `,
        [publicKey, email, amount, currency, reference]
    );

    const handleMessage = (event: WebViewMessageEvent) => {
        try {
            const payload = JSON.parse(event.nativeEvent.data);
            if (payload.type === 'success') {
                onSuccess(payload.reference);
            } else {
                onClose();
            }
        } catch {
            onClose();
        }
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={styles.closeText}>✕ Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Secure Payment</Text>
                    <View style={{ width: 60 }} />
                </View>
                <WebView
                    source={{ html }}
                    onMessage={handleMessage}
                    startInLoadingState
                    renderLoading={() => (
                        <View style={styles.loading}>
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    )}
                />
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.white },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 52,
        paddingBottom: spacing.md,
        paddingHorizontal: spacing.lg,
        borderBottomWidth: 0.5,
        borderBottomColor: colors.border,
    },
    closeText: { color: colors.error, fontFamily: fonts.medium, fontSize: 14 },
    title: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.textPrimary },
    loading: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.white,
    },
});