import os
from huggingface_hub import HfApi

def deploy():
    token = "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"
    api = HfApi(token=token)

    try:
        whoami = api.whoami()
        username = whoami["name"]
        print(f"Logged in as: {username}")
    except Exception as e:
        print(f"Failed to authenticate: {e}")
        return

    space_name = "maillens-api"
    repo_id = f"{username}/{space_name}"

    print(f"Creating Docker Space: {repo_id}...")
    try:
        api.create_repo(repo_id=repo_id, repo_type="space", space_sdk="docker", private=False)
        print("Space created!")
    except Exception as e:
        print(f"Could not create space (it might already exist): {e}")

    print("Uploading backend files to Hugging Face Spaces...")
    # Upload everything in the backend folder except virtual environments or git folders
    try:
        api.upload_folder(
            folder_path=".",
            repo_id=repo_id,
            repo_type="space",
            ignore_patterns=[".venv/*", "__pycache__/*", ".git/*", ".env", "deploy_hf.py"]
        )
        print(f"""
===================================================
DEPLOYMENT SUCCESSFUL!
Your backend API is now building at:
https://huggingface.co/spaces/{repo_id}
===================================================
""")
    except Exception as e:
        print(f"Failed to upload files: {e}")

if __name__ == "__main__":
    deploy()
