from app.core.db import supabase

def check_data():
    # Count emails
    email_count = supabase.table("emails").select("id", count="exact").execute().count
    print(f"Total emails in DB: {email_count}")
    
    # Check first few emails
    emails = supabase.table("emails").select("id, subject, user_id").limit(5).execute().data
    print(f"Sample emails: {emails}")
    
    # Check labels
    label_count = supabase.table("labels").select("id", count="exact").execute().count
    print(f"Total labels in DB: {label_count}")

if __name__ == "__main__":
    check_data()
