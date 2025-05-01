package edu.example.springmvcdemo.dao;

import edu.example.springmvcdemo.model.Image;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ImageRepository extends JpaRepository<Image, Long> {
    Optional<Image> findByLink(String name);
}
