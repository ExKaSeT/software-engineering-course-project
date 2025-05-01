package edu.example.springmvcdemo.config;

import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.stereotype.Component;

@Component
public class SpringContextHolder implements ApplicationContextAware {

    private static ApplicationContext context;

    @Override
    public void setApplicationContext(ApplicationContext ctx) {
        SpringContextHolder.context = ctx;
    }

    public static ApplicationContext getApplicationContext() {
        return context;
    }
}
