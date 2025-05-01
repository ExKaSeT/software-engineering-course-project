package edu.example.springmvcdemo.service;

import edu.example.springmvcdemo.dao.mongo.OperationRepository;
import edu.example.springmvcdemo.model.Operation;
import edu.example.springmvcdemo.model.Operation.OperationType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class OperationService {

    private final OperationRepository operationRepository;

    public void logOperation(OperationType type, String content) {
        Operation operation = new Operation();
        operation.setContent(content);
        operation.setType(type);
        operationRepository.save(operation);
    }
}
