import hmac
import hashlib
import os
from typing import Dict, Any

class HMACGateway:
    """Utility class for verifying HMAC‑signed external requests.

    The gateway expects an ``X‑Signature`` HTTP header containing a
    hexadecimal HMAC‑SHA256 digest of the request body, using a secret
    key stored in the ``EXTERNAL_GATEWAY_HMAC_KEY`` environment variable.
    If the signature is missing or does not match, a ``PermissionError``
    is raised.
    """

    def __init__(self, secret_key: str | None = None):
        # Load the secret from the environment if not provided explicitly.
        self.secret_key = secret_key or os.getenv("EXTERNAL_GATEWAY_HMAC_KEY")
        if not self.secret_key:
            raise RuntimeError(
                "HMAC secret key not configured. Set EXTERNAL_GATEWAY_HMAC_KEY in the environment."
            )

    def _calculate_hmac(self, data: bytes) -> str:
        """Return the hex‑encoded HMAC‑SHA256 of *data* using the secret key."""
        return hmac.new(self.secret_key.encode(), data, hashlib.sha256).hexdigest()

    def verify(self, payload: bytes, signature_header: str | None) -> bool:
        """Validate an incoming request.

        Parameters
        ----------
        payload: ``bytes``
            The raw request body.
        signature_header: ``str | None``
            The value of the ``X‑Signature`` header sent by the client.

        Returns
        -------
        ``bool`` – ``True`` if the signature matches; otherwise raises ``PermissionError``.
        """
        if not signature_header:
            raise PermissionError("Missing X-Signature header for HMAC verification.")

        expected = self._calculate_hmac(payload)
        # Use ``compare_digest`` to mitigate timing attacks.
        if not hmac.compare_digest(expected, signature_header):
            raise PermissionError("Invalid HMAC signature – request rejected.")
        return True

    # Convenience wrapper for typical Django/DRF view usage
    def middleware(self, request: Any) -> Any:
        """Django‑style middleware that validates the request before view execution.

        Example usage in ``settings.py``::

            MIDDLEWARE = [
                ...
                "smart_agri.gateways.external_gateway.HMACGatewayMiddleware",
            ]
        """
        signature = request.headers.get("X-Signature")
        body = request.body if hasattr(request, "body") else b""
        self.verify(body, signature)
        return request

# Export a singleton that can be imported elsewhere
gateway = HMACGateway()
