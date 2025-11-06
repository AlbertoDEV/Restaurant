package com.meson;

import com.meson.models.User;
import com.meson.repositories.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class RestaurantApplication {

    public static void main(String[] args) {
        SpringApplication.run(RestaurantApplication.class, args);
    }

    @Bean
    CommandLineRunner init(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (userRepository.findByUsername("admin").isEmpty()) {
                User admin = new User();
                admin.setUsername("admin");
                admin.setPassword(passwordEncoder.encode("password"));
                admin.setRole("ADMIN");
                userRepository.save(admin);
            }
            if (userRepository.findByUsername("waiter").isEmpty()) {
                User waiter = new User();
                waiter.setUsername("waiter");
                waiter.setPassword(passwordEncoder.encode("password"));
                waiter.setRole("WAITER");
                userRepository.save(waiter);
            }
            if (userRepository.findByUsername("cook").isEmpty()) {
                User cook = new User();
                cook.setUsername("cook");
                cook.setPassword(passwordEncoder.encode("password"));
                cook.setRole("COOK");
                userRepository.save(cook);
            }
        };
    }
}