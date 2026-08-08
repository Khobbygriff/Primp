package com.primp.user_service.config;

import com.primp.user_service.model.User;
import com.primp.user_service.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * One-time admin account bootstrap. Public registration
 * (UserService#register) now rejects role=ADMIN outright, so this is the
 * only sanctioned way to create the first admin account without a manual
 * DB insert.
 *
 * Reads ADMIN_BOOTSTRAP_EMAIL / ADMIN_BOOTSTRAP_PASSWORD via the same
 * spring-dotenv mechanism every other secret in this service already
 * uses. Does nothing if either is unset, or if any admin already exists —
 * safe to leave these vars in a deployed .env indefinitely without
 * re-seeding on every restart.
 */
@Component
public class AdminBootstrapRunner implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final Environment environment;

    public AdminBootstrapRunner(UserRepository userRepository,
                                PasswordEncoder passwordEncoder,
                                Environment environment) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.environment = environment;
    }

    @Override
    public void run(String... args) {
        String email = environment.getProperty("ADMIN_BOOTSTRAP_EMAIL");
        String password = environment.getProperty("ADMIN_BOOTSTRAP_PASSWORD");

        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            return;
        }

        if (userRepository.existsByEmail(email)) {
            return;
        }

        boolean anyAdminExists = !userRepository.findByRole(User.Role.ADMIN).isEmpty();
        if (anyAdminExists) {
            System.out.println("[AdminBootstrapRunner] An ADMIN account already exists; skipping bootstrap for "
                    + email + ". Remove ADMIN_BOOTSTRAP_EMAIL/PASSWORD from .env once no longer needed.");
            return;
        }

        User admin = new User();
        admin.setName(environment.getProperty("ADMIN_BOOTSTRAP_NAME", "Primp Admin"));
        admin.setEmail(email);
        admin.setPassword(passwordEncoder.encode(password));
        admin.setRole(User.Role.ADMIN);

        userRepository.save(admin);
        System.out.println("[AdminBootstrapRunner] Created initial admin account: " + email
                + ". Remove ADMIN_BOOTSTRAP_PASSWORD from .env now that the account exists.");
    }
}