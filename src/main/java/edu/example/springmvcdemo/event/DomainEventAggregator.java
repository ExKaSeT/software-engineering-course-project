package edu.example.springmvcdemo.event;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class DomainEventAggregator {
    private final List<DomainEventObserver> observers = new CopyOnWriteArrayList<>();

    public void registerObserver(DomainEventObserver obs) {
        observers.add(obs);
    }

    public void unregisterObserver(DomainEventObserver obs) {
        observers.remove(obs);
    }

    public void publish(DomainEvent event) {
        observers.forEach(o -> o.onEvent(event));
    }
}