"""
Multi-City NCR Data Collection Scheduler
Collects AQI + Weather for Delhi, Noida, Gurgaon, Ghaziabad, Faridabad
"""
import schedule
import time
from datetime import datetime
from collect_all import collect_all_data

def scheduled_collection():
    print("\n" + "⏰"*30)
    print(f"⏰ SCHEDULED COLLECTION — {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("⏰"*30 + "\n")
    collect_all_data()

def main():
    print("="*60)
    print("🤖 AIRSENSE — MULTI-CITY NCR SCHEDULER")
    print("="*60)
    print(f"🕐 Started  : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🏙️  Cities   : Delhi, Noida, Gurgaon, Ghaziabad, Faridabad")
    print(f"⏱️  Interval : Every 30 minutes")
    print(f"💡 Press Ctrl+C to stop")
    print("="*60 + "\n")

    # Run immediately on start
    print("🚀 Running initial collection...\n")
    collect_all_data()

    # Schedule every 30 minutes (more frequent than before)
    schedule.every(30).minutes.do(scheduled_collection)

    print("⏰ Scheduler running — next collection in 30 minutes")
    print("💡 Press Ctrl+C to stop\n")

    try:
        while True:
            schedule.run_pending()
            time.sleep(30)
    except KeyboardInterrupt:
        print("\n" + "="*60)
        print("🛑 Scheduler stopped")
        print(f"🕐 Stopped: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*60)

if __name__ == "__main__":
    main()