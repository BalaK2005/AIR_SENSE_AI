"""
Data Collection Scheduler
Automatically collects data at regular intervals
"""
import schedule
import time
from datetime import datetime
from collect_all import collect_all_data


def scheduled_collection():
    """Function to run on schedule"""
    print("\n" + "⏰" * 30)
    print(f"⏰ SCHEDULED COLLECTION TRIGGERED")
    print(f"⏰ Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("⏰" * 30 + "\n")
    
    collect_all_data()


def main():
    """Run scheduler"""
    print("="*60)
    print("🤖 AIRVISION - AUTOMATED DATA COLLECTION SCHEDULER")
    print("="*60)
    print(f"⏰ Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"📊 Collection Interval: Every 1 hour")
    print(f"💡 Press Ctrl+C to stop")
    print("="*60 + "\n")
    
    # Run immediately on start
    print("🚀 Running initial collection...\n")
    collect_all_data()
    
    # Schedule for every hour
    schedule.every(1).hours.do(scheduled_collection)
    
    print("\n⏰ Scheduler is now running...")
    print("⏰ Next collection in 1 hour")
    print("💡 Press Ctrl+C to stop\n")
    
    # Keep running
    try:
        while True:
            schedule.run_pending()
            time.sleep(60)  # Check every minute
    except KeyboardInterrupt:
        print("\n\n" + "="*60)
        print("🛑 Scheduler stopped by user")
        print(f"⏰ Stopped: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*60)


if __name__ == "__main__":
    main()