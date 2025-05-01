package edu.example.springmvcdemo.event.config;

import edu.example.springmvcdemo.config.SpringContextHolder;
import edu.example.springmvcdemo.event.DomainEvent;
import edu.example.springmvcdemo.event.DomainEventAggregator;
import org.hibernate.boot.Metadata;
import org.hibernate.engine.spi.SessionFactoryImplementor;
import org.hibernate.event.service.spi.EventListenerRegistry;
import org.hibernate.event.spi.EventType;
import org.hibernate.event.spi.PostCommitDeleteEventListener;
import org.hibernate.event.spi.PostCommitInsertEventListener;
import org.hibernate.event.spi.PostCommitUpdateEventListener;
import org.hibernate.event.spi.PostDeleteEvent;
import org.hibernate.event.spi.PostInsertEvent;
import org.hibernate.event.spi.PostUpdateEvent;
import org.hibernate.integrator.spi.Integrator;
import org.hibernate.persister.entity.EntityPersister;
import org.hibernate.service.spi.SessionFactoryServiceRegistry;

/**
 * Integrator, регистрирует Post-commit слушатели,
 * в момент события берет текущий Spring-контекст
 * и из него — DomainEventAggregator.
 */
public class HibernateDomainEventIntegrator implements Integrator {

    @Override
    public void integrate(
            Metadata metadata,
            SessionFactoryImplementor sessionFactory,
            SessionFactoryServiceRegistry serviceRegistry) {

        var registry =
                serviceRegistry.getService(EventListenerRegistry.class);

        // INSERT
        registry.getEventListenerGroup(EventType.POST_COMMIT_INSERT)
                .appendListener(new PostCommitInsertEventListener() {
                    @Override
                    public boolean requiresPostCommitHandling(EntityPersister persister) {
                        return true;
                    }

                    @Override
                    public void onPostInsert(PostInsertEvent event) {
                        var ctx = SpringContextHolder.getApplicationContext();
                        if (ctx != null) {
                            var agg = ctx.getBean(DomainEventAggregator.class);
                            agg.publish(new DomainEvent(event.getEntity(), DomainEvent.EventType.CREATED));
                        }
                    }

                    @Override
                    public void onPostInsertCommitFailed(PostInsertEvent event) {/*noop*/}
                });

        // UPDATE
        registry.getEventListenerGroup(EventType.POST_COMMIT_UPDATE)
                .appendListener(new PostCommitUpdateEventListener() {
                    @Override
                    public boolean requiresPostCommitHandling(EntityPersister persister) {
                        return true;
                    }

                    @Override
                    public void onPostUpdate(PostUpdateEvent event) {
                        var ctx = SpringContextHolder.getApplicationContext();
                        if (ctx != null) {
                            var agg = ctx.getBean(DomainEventAggregator.class);
                            agg.publish(new DomainEvent(event.getEntity(), DomainEvent.EventType.UPDATED));
                        }
                    }

                    @Override
                    public void onPostUpdateCommitFailed(PostUpdateEvent event) {/*noop*/}
                });

        // DELETE
        registry.getEventListenerGroup(EventType.POST_COMMIT_DELETE)
                .appendListener(new PostCommitDeleteEventListener() {
                    @Override
                    public boolean requiresPostCommitHandling(EntityPersister persister) {
                        return true;
                    }

                    @Override
                    public void onPostDelete(PostDeleteEvent event) {
                        var ctx = SpringContextHolder.getApplicationContext();
                        if (ctx != null) {
                            var agg = ctx.getBean(DomainEventAggregator.class);
                            agg.publish(new DomainEvent(event.getEntity(), DomainEvent.EventType.DELETED));
                        }
                    }

                    @Override
                    public void onPostDeleteCommitFailed(PostDeleteEvent event) {/*noop*/}
                });
    }

    @Override
    public void disintegrate(
            SessionFactoryImplementor sessionFactory,
            SessionFactoryServiceRegistry serviceRegistry) {
        // ничего не делаем
    }
}
