import subprocess, os, pathlib, shutil

os.chdir('d:/DatqBoxWorkspace/zentto-tickets')
subprocess.run(['git', 'checkout', 'feat/checkout-payment-qr-scanner'], check=True)
print("Branch:", subprocess.run(['git', 'branch', '--show-current'], capture_output=True, text=True).stdout.strip())

pathlib.Path('frontend/src/components').mkdir(parents=True, exist_ok=True)
pathlib.Path('frontend/src/app/boletos/[id]').mkdir(parents=True, exist_ok=True)

# --- QrScanner.tsx ---
open('frontend/src/components/QrScanner.tsx', 'w').write(open('d:/DatqBoxWorkspace/zentto-tickets/_QrScanner.tsx').read())
# --- QrTicketCard.tsx ---
open('frontend/src/components/QrTicketCard.tsx', 'w').write(open('d:/DatqBoxWorkspace/zentto-tickets/_QrTicketCard.tsx').read())
# --- boletos/[id]/page.tsx ---
open('frontend/src/app/boletos/[id]/page.tsx', 'w').write(open('d:/DatqBoxWorkspace/zentto-tickets/_BoletosDetail.tsx').read())
# --- checkout/page.tsx ---
open('frontend/src/app/checkout/page.tsx', 'w').write(open('d:/DatqBoxWorkspace/zentto-tickets/_Checkout.tsx').read())
# --- scan/page.tsx ---
open('frontend/src/app/scan/page.tsx', 'w').write(open('d:/DatqBoxWorkspace/zentto-tickets/_Scan.tsx').read())

print("All files written")

subprocess.run(['git', 'add',
    'frontend/src/components/QrScanner.tsx',
    'frontend/src/components/QrTicketCard.tsx',
    'frontend/src/app/boletos/[id]/page.tsx',
    'frontend/src/app/checkout/page.tsx',
    'frontend/src/app/scan/page.tsx',
], check=True)

subprocess.run(['git', 'commit', '-m', 'feat: checkout 2-step flow + boletos detail with QR + scanner with camera'], check=True)
print("COMMIT DONE")

# Cleanup temp files
for f in ['_QrScanner.tsx', '_QrTicketCard.tsx', '_BoletosDetail.tsx', '_Checkout.tsx', '_Scan.tsx', '_apply.py']:
    try: os.remove(f)
    except: pass
