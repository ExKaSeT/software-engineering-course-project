package edu.example.springmvcdemo.dto.operation;

import edu.example.springmvcdemo.model.Operation;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OperationDto {
    private String id;
    private String content;
    private LocalDateTime date;
    private Operation.OperationType type;
}
