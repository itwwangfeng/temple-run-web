import type { EventMap } from "./types";

type Listener<K extends keyof EventMap> = (payload: EventMap[K]) => void;

type ListenerMap = {
  [K in keyof EventMap]?: Array<Listener<K>>;
};

export class EventBus {
  private listeners: ListenerMap = {};

  on<K extends keyof EventMap>(event: K, handler: Listener<K>) {
    const list = (this.listeners[event] ?? []) as Array<Listener<K>>;
    list.push(handler);
    this.listeners[event] = list as ListenerMap[K];
    return () => this.off(event, handler);
  }

  off<K extends keyof EventMap>(event: K, handler: Listener<K>) {
    const list = this.listeners[event] as Array<Listener<K>> | undefined;
    if (!list) return;
    this.listeners[event] = list.filter((item) => item !== handler) as ListenerMap[K];
  }

  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]) {
    const list = this.listeners[event] as Array<Listener<K>> | undefined;
    if (!list) return;
    list.forEach((handler) => handler(payload));
  }
}
