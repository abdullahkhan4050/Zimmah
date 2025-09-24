
import { EventEmitter } from 'events';
import { FirestorePermissionError } from './errors';

type Events = {
  'permission-error': (error: FirestorePermissionError) => void;
};

// We need to extend the EventEmitter to get type-safe events.
// This is a workaround for the lack of a generic EventEmitter in Node.js.
declare interface TypedEventEmitter<TEvents extends Record<string, any>> {
  on<TEvent extends keyof TEvents>(
    event: TEvent,
    listener: TEvents[TEvent]
  ): this;
  off<TEvent extends keyof TEvents>(
    event: TEvent,
    listener: TEvents[TEvent]
  ): this;
  emit<TEvent extends keyof TEvents>(
    event: TEvent,
    ...args: Parameters<TEvents[TEvent]>
  ): boolean;
}

class TypedEventEmitter<
  TEvents extends Record<string, any>
> extends EventEmitter {}

// Create a singleton event emitter so that we can listen for errors
// from anywhere in the app.
export const errorEmitter = new TypedEventEmitter<Events>();
