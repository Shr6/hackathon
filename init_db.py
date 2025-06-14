from main import db, app, generate_dummy_data

with app.app_context():
    db.create_all()
    generate_dummy_data()
    print("✅ Tables created.")