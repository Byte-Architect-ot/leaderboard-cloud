import pandas as pd
import json
import os

def process_excel_to_json():
    """Process Excel file and convert to JSON format for the web app"""

    # Check if Excel file exists
    excel_file = "Walchand College of Engineering - Sangli, India [26 Oct].xlsx"
    if not os.path.exists(excel_file):
        print(f"Excel file {excel_file} not found!")
        return False

    try:
        # Read Excel file
        df = pd.read_excel(excel_file)
        print("Excel file loaded successfully!")
        print(f"Shape: {df.shape}")
        print(f"Columns: {list(df.columns)}")

        # Clean column names
        df.columns = df.columns.str.strip()

        # Convert to dictionary format
        participants = []

        for index, row in df.iterrows():
            # Extract name
            name = str(row['User Name']) if pd.notna(row['User Name']) else f'Participant {index + 1}'

            # Extract email
            email = str(row['User Email']) if pd.notna(row['User Email']) else ''

            # Extract badge count - try different columns
            badges = 0
            if '# of Skill Badges Completed' in df.columns and pd.notna(row['# of Skill Badges Completed']):
                try:
                    badges = int(row['# of Skill Badges Completed'])
                except:
                    badges = 0

            # Calculate progress based on badges (assuming 20 is max)
            progress = min(100, ((badges+1) / 20) * 100) if badges > 0 else 0

            # Generate some realistic data for demonstration
            streak = max(1, min(30, badges * 2)) if badges > 0 else 1
            total_hours = badges * 2.5 if badges > 0 else 0.5
            modules_completed = min(5, (badges // 4) + 1) if badges > 0 else 1

            participant = {
                'Name': name,
                'College': 'WCE Sangli',
                'Email': email,
                'Badges': badges,
                'Streak': streak,
                'Progress': int(progress),
                'Rank': index + 1,
                'CompletionDate': '',
                'LastActivity': '',
                'TotalHours': round(total_hours, 1),
                'ModulesCompleted': modules_completed
            }

            participants.append(participant)

        # Sort by badges (descending) and update ranks
        participants.sort(key=lambda x: x['Badges'], reverse=True)
        for i, participant in enumerate(participants):
            participant['Rank'] = i + 1

        # Save to JSON file
        with open('participants_data.json', 'w', encoding='utf-8') as f:
            json.dump(participants, f, indent=2, ensure_ascii=False)

        print(f"\nProcessed {len(participants)} participants")
        print("Data saved to participants_data.json")

        # Show sample data
        print("\nTop 5 participants:")
        for i, p in enumerate(participants[:5]):
            print(f"Rank {p['Rank']}: {p['Name']} - {p['Badges']} badges, {p['Progress']}% progress")

        # Also create a CSV backup
        df_export = pd.DataFrame(participants)
        df_export.to_csv('participants_data_processed.csv', index=False)
        print("CSV backup saved to participants_data_processed.csv")

        return True

    except Exception as e:
        print(f"Error processing Excel file: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    process_excel_to_json()
