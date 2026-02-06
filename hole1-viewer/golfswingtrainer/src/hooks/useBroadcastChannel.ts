import { useEffect, useCallback, useRef } from 'react';

export interface BroadcastChannelOptions<T> {
  /**
   * Name of the BroadcastChannel
   */
  channelName: string;
  /**
   * Expected message type to filter
   */
  messageType: string;
  /**
   * Key in event.data that contains the payload
   */
  payloadKey: string;
  /**
   * Callback when valid message received
   */
  onMessage: (payload: T) => void;
  /**
   * Optional validator for the payload
   */
  validator?: (payload: unknown) => payload is T;
}

/**
 * Hook to manage BroadcastChannel subscriptions
 * - Sets up channel listener on mount
 * - Filters messages by type
 * - Validates payload if validator provided
 * - Cleans up on unmount
 */
export function useBroadcastChannel<T>({
  channelName,
  messageType,
  payloadKey,
  onMessage,
  validator,
}: BroadcastChannelOptions<T>): void {
  const onMessageRef = useRef(onMessage);

  // Keep callback ref updated
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    const channel = new BroadcastChannel(channelName);

    channel.onmessage = (event) => {
      if (event.data?.type === messageType && event.data?.[payloadKey]) {
        const payload = event.data[payloadKey];

        if (validator) {
          if (validator(payload)) {
            onMessageRef.current(payload);
          }
        } else {
          onMessageRef.current(payload as T);
        }
      }
    };

    return () => {
      channel.close();
    };
  }, [channelName, messageType, payloadKey, validator]);
}

/**
 * Simplified hook for common case: listen to a channel and update state
 */
export function useBroadcastChannelState<T>(
  channelName: string,
  messageType: string,
  payloadKey: string,
  setState: (value: T) => void,
  validator?: (payload: unknown) => payload is T
): void {
  const handleMessage = useCallback(
    (payload: T) => {
      setState(payload);
    },
    [setState]
  );

  useBroadcastChannel({
    channelName,
    messageType,
    payloadKey,
    onMessage: handleMessage,
    validator,
  });
}
