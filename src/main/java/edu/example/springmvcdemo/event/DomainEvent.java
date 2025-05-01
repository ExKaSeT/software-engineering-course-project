package edu.example.springmvcdemo.event;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class DomainEvent {
    private final Object entity;
    private final EventType type;
    private final LocalDateTime timestamp;

    public enum EventType { CREATED, UPDATED, DELETED }

    public DomainEvent(Object entity, EventType type) {
        this.entity = entity;
        this.type = type;
        this.timestamp = LocalDateTime.now();
    }
}
