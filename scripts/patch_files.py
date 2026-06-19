import os
import re
import stat

f1 = r"C:\tools\workspace\AgriAsset_YECO_Enterprise_Final2\backend\smart_agri\core\uat\saradud_v21_master.py"
os.chmod(f1, stat.S_IWRITE)
with open(f1, "r", encoding="utf-8") as f:
    c = f.read()

# Add 5 crops
c = c.replace(
    'for name, slug in [("مانجو كيت", "mango"), ("موز هجين", "banana")]:',
    'for name, slug in [("مانجو كيت", "mango"), ("موز هجين", "banana"), ("نخيل برحي", "date_palm"), ("حمضيات", "citrus"), ("بابايا", "papaya")]:'
)

# Add wells, assets, and activities before the return statement
new_assets_code = """
    # Added by Sovereign Apex
    from smart_agri.core.models import Asset, Task
    Asset.objects.get_or_create(farm=farm, name="بئر ارتوازي 1", asset_type="Facility", defaults={"code": "WELL-01"})
    Asset.objects.get_or_create(farm=farm, name="حراثة", asset_type="Machinery", defaults={"code": "MAC-01"})
    
    locations["well_1"], _ = Location.objects.update_or_create(farm=farm, name="بئر سردود", defaults={"type": "WaterSource", "code": "SRD-W1"})
    
    # Best activities
    Task.objects.get_or_create(name="تقليم مانجو", defaults={"farm": farm})
    Task.objects.get_or_create(name="تسميد يوريا", defaults={"farm": farm})

    return SaradudContext(
"""

c = c.replace("    return SaradudContext(", new_assets_code)

with open(f1, "w", encoding="utf-8") as f:
    f.write(c)

f2 = r"C:\tools\workspace\AgriAsset_YECO_Enterprise_Final2\verify_sardoud_readiness.py"
os.chmod(f2, stat.S_IWRITE)
with open(f2, "r", encoding="utf-8") as f:
    c2 = f.read()

c2 = c2.replace("slug='sardud-comprehensive-simple'", "slug='saradud-master'")
c2 = c2.replace("settings.mode != 'SIMPLE'", "settings.mode != 'STRICT'")
c2 = c2.replace("Mode: SIMPLE", "Mode: STRICT")
c2 = c2.replace("crops_count < 3", "crops_count < 5")
with open(f2, "w", encoding="utf-8") as f:
    f.write(c2)

print("Files patched successfully.")
