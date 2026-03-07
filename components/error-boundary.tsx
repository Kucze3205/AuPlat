import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches unhandled JS errors in the component tree and displays
 * a full-screen fallback instead of crashing the app.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ThemedView style={styles.container}>
          <View style={styles.content}>
            <ThemedText style={styles.icon}>⚠️</ThemedText>
            <ThemedText type="title" style={styles.title}>
              Something went wrong
            </ThemedText>
            <ThemedText style={styles.message}>
              {this.state.error?.message ?? 'An unexpected error occurred.'}
            </ThemedText>
            <Pressable style={styles.button} onPress={this.handleReset}>
              <ThemedText type="defaultSemiBold" style={styles.buttonText}>
                Try Again
              </ThemedText>
            </Pressable>
          </View>
        </ThemedView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    textAlign: 'center',
    opacity: 0.6,
    marginBottom: 24,
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#ea7a1f',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
  },
});
