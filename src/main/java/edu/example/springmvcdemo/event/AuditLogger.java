package edu.example.springmvcdemo.event;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class AuditLogger implements DomainEventObserver {

    @Override
    public void onEvent(DomainEvent event) {
        log.info("[AUDIT] {} event on {} at {}",
                event.getType(), event.getEntity(), event.getTimestamp());
    }
}