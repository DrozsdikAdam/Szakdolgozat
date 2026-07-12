package hu.mes.backend.services;

import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import hu.mes.backend.repositories.UserRepository;
import hu.mes.backend.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public CustomUserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return this.userRepository.findByNameAndActiveTrue(username)
                .map(CustomUserDetails::new)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "A megadott felhasználónév nem létezik vagy inaktív: " + username));
    }
}
