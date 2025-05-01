package edu.example.springmvcdemo.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Operation {
    @Id
    private String id;

    private String content;

    @CreationTimestamp
    private LocalDateTime date;

    private OperationType type;

    public enum OperationType {
        WRITE,
        READ
    }
}

