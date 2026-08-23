import pandas as pd

files = [
    "ADMIN BARU.xlsx",
    "data_konfirmasi_260731232801.xlsx",
    "data_order_part_260731232739.xlsx",
    "data_siap_diambil_260731233045.xlsx"
]

def analyze_excel(file_path):
    print(f"\n{'='*50}\nFile: {file_path}\n{'='*50}")
    try:
        xl = pd.ExcelFile(file_path)
        for sheet_name in xl.sheet_names:
            print(f"\n--- Sheet: {sheet_name} ---")
            df = pd.read_excel(file_path, sheet_name=sheet_name, header=None, nrows=10)
            if df.empty:
                print("Sheet is empty.")
                continue
            
            # Print first 5 rows to identify where the actual table header is
            for idx, row in df.head(5).iterrows():
                # drop completely NaN values for cleaner print
                clean_row = [str(x) for x in row.values if pd.notna(x)]
                print(f"Row {idx}: {clean_row}")
                
    except Exception as e:
        print(f"Error reading file: {e}")

for f in files:
    analyze_excel(f)
