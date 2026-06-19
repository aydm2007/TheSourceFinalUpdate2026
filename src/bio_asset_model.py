'''bio_asset_model.py

Utility module for modeling biophysical agricultural assets.
Provides functions to compute:
- Soil hydration index (based on moisture content and field capacity)
- Crop yield estimate (using crop‑specific coefficients, hydration, and seasonal factors)
- Asset monetary value (yield * market price)

All functions are pure‑Python and have no external side‑effects, making them safe for inclusion
in the sovereign codebase.
'''

from __future__ import annotations
from dataclasses import dataclass
from typing import Dict, List

# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class SoilProfile:
    """Represents the physical state of a soil parcel.

    Attributes
    ----------
    moisture_content: float
        Current volumetric water content (m³/m³).
    field_capacity: float
        Maximum water the soil can hold after drainage (m³/m³).
    wilting_point: float
        Minimum water content below which plants cannot extract water (m³/m³).
    """

    moisture_content: float
    field_capacity: float
    wilting_point: float

    def hydration_index(self) -> float:
        """Return a normalized hydration index between 0 and 1.

        The index is computed as the proportion of usable water that the soil
        currently holds:

        .. math::
            I = \frac{M - WP}{FC - WP}

        where ``M`` is moisture_content, ``FC`` is field_capacity and ``WP``
        is wilting_point.  Values are clipped to the [0, 1] range.
        """
        usable = self.field_capacity - self.wilting_point
        if usable <= 0:
            return 0.0
        index = (self.moisture_content - self.wilting_point) / usable
        return max(0.0, min(1.0, index))


@dataclass(frozen=True)
class CropCoefficients:
    """Crop‑specific coefficients used for yield estimation.

    Attributes
    ----------
    base_yield: float
        Expected yield (tons/ha) under optimal conditions.
    moisture_sensitivity: float
        Exponent that modulates how yield reacts to hydration index.
    market_price: float
        Current market price per ton of the crop (currency units).
    """

    base_yield: float
    moisture_sensitivity: float
    market_price: float

    def expected_yield(self, hydration_index: float) -> float:
        """Calculate expected yield given a hydration index.

        The model follows a simple power‑law relationship:
        ``yield = base_yield * (hydration_index ** moisture_sensitivity)``
        This captures diminishing returns when water is scarce and a plateau
        near saturation.
        """
        if hydration_index <= 0:
            return 0.0
        return self.base_yield * (hydration_index ** self.moisture_sensitivity)

    def asset_value(self, hydration_index: float) -> float:
        """Monetary value of the crop on this parcel.

        ``value = expected_yield * market_price``
        """
        return self.expected_yield(hydration_index) * self.market_price


# ---------------------------------------------------------------------------
# Helper dictionaries – these would normally be loaded from a DB or config.
# ---------------------------------------------------------------------------

DEFAULT_CROP_COEFFICIENTS: Dict[str, CropCoefficients] = {
    "wheat": CropCoefficients(base_yield=7.0, moisture_sensitivity=1.2, market_price=210.0),
    "corn": CropCoefficients(base_yield=10.0, moisture_sensitivity=1.1, market_price=180.0),
    "soy": CropCoefficients(base_yield=3.2, moisture_sensitivity=1.3, market_price=420.0),
    "rice": CropCoefficients(base_yield=6.5, moisture_sensitivity=1.0, market_price=250.0),
}


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def compute_hydration_index(
    moisture_content: float,
    field_capacity: float,
    wilting_point: float,
) -> float:
    """Convenient wrapper returning the hydration index for raw inputs.

    Parameters
    ----------
    moisture_content, field_capacity, wilting_point : float
        Values expressed in volumetric water content (m³/m³).
    """
    profile = SoilProfile(
        moisture_content=moisture_content,
        field_capacity=field_capacity,
        wilting_point=wilting_point,
    )
    return profile.hydration_index()


def estimate_crop_yield(
    crop: str,
    hydration_index: float,
) -> float:
    """Estimate the yield (tons/ha) for *crop* given a hydration index.

    Raises
    ------
    KeyError
        If the crop is not present in ``DEFAULT_CROP_COEFFICIENTS``.
    """
    coeffs = DEFAULT_CROP_COEFFICIENTS[crop]
    return coeffs.expected_yield(hydration_index)


def calculate_asset_value(
    crop: str,
    hydration_index: float,
) -> float:
    """Calculate the monetary value of the agricultural asset.

    This combines the expected yield with the current market price.
    """
    coeffs = DEFAULT_CROP_COEFFICIENTS[crop]
    return coeffs.asset_value(hydration_index)


def batch_evaluate(
    soils: List[SoilProfile],
    crop: str,
) -> List[Dict[str, float]]:
    """Batch evaluate a list of soil profiles for a single crop.

    Returns a list of dictionaries with keys:
    - ``hydration_index``
    - ``expected_yield``
    - ``asset_value``
    """
    results: List[Dict[str, float]] = []
    coeffs = DEFAULT_CROP_COEFFICIENTS[crop]
    for soil in soils:
        h_idx = soil.hydration_index()
        results.append(
            {
                "hydration_index": h_idx,
                "expected_yield": coeffs.expected_yield(h_idx),
                "asset_value": coeffs.asset_value(h_idx),
            }
        )
    return results


# ---------------------------------------------------------------------------
# Simple sanity‑check when the module is executed directly.
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    # Example: a wheat field with moderate moisture.
    example_soil = SoilProfile(moisture_content=0.28, field_capacity=0.35, wilting_point=0.15)
    h = example_soil.hydration_index()
    print(f"Hydration index: {h:.3f}")
    print(f"Wheat expected yield (t/ha): {estimate_crop_yield('wheat', h):.2f}")
    print(f"Asset value (currency): {calculate_asset_value('wheat', h):.2f}")
