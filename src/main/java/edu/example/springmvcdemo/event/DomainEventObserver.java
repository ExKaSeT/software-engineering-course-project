package edu.example.springmvcdemo.event;

public interface DomainEventObserver {
    void onEvent(DomainEvent event);
}
