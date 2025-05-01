package edu.example.springmvcdemo.event.config;

import edu.example.springmvcdemo.event.DomainEventAggregator;
import edu.example.springmvcdemo.event.DomainEventObserver;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class ObserverRegistrar {
    private final DomainEventAggregator aggregator;
    private final List<DomainEventObserver> allObservers;

    @PostConstruct
    public void registerAll() {
        allObservers.forEach(aggregator::registerObserver);
    }
}