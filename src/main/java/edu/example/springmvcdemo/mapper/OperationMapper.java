package edu.example.springmvcdemo.mapper;

import edu.example.springmvcdemo.dto.operation.OperationDto;
import edu.example.springmvcdemo.model.Operation;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface OperationMapper {

    OperationDto toOperationDto(Operation operation);
}
