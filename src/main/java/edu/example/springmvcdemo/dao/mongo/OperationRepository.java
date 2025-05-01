package edu.example.springmvcdemo.dao.mongo;

import edu.example.springmvcdemo.model.Operation;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface OperationRepository extends MongoRepository<Operation, String> {
}
