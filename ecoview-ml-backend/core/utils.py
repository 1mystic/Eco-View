import socket
import ipaddress
from urllib.parse import urlparse

def validate_url_for_ssrf(url: str) -> None:
    """
    Validates that a URL is safe from SSRF by parsing its hostname,
    resolving it to IP addresses, and verifying that none of the resolved IPs
    are in private, loopback, link-local, or multicast address blocks.
    Raises ValueError if the URL is determined to be unsafe or invalid.
    """
    parsed_url = urlparse(url)
    if not parsed_url.scheme or parsed_url.scheme not in ("http", "https"):
        raise ValueError("Invalid URL scheme. Only HTTP and HTTPS are allowed.")
        
    hostname = parsed_url.hostname
    if not hostname:
        raise ValueError("Invalid URL: missing hostname.")
        
    try:
        # Resolve all IPs associated with the hostname (ipv4 and ipv6)
        addr_info = socket.getaddrinfo(hostname, None)
    except socket.gaierror as e:
        raise ValueError(f"Failed to resolve hostname '{hostname}': {e}")
        
    for item in addr_info:
        ip_str = item[4][0]
        try:
            ip = ipaddress.ip_address(ip_str)
        except ValueError:
            # Ignore address structures that do not parse cleanly as standard IPs
            continue
            
        if ip.is_loopback:
            raise ValueError(f"SSRF Protection: Loopback access to '{ip_str}' is forbidden.")
        if ip.is_private:
            raise ValueError(f"SSRF Protection: Private network access to '{ip_str}' is forbidden.")
        if ip.is_link_local:
            raise ValueError(f"SSRF Protection: Link-local access to '{ip_str}' is forbidden.")
        if ip.is_multicast:
            raise ValueError(f"SSRF Protection: Multicast access to '{ip_str}' is forbidden.")
