#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script để parse dữ liệu từ file HTML showcase.html thành JSON
với format phù hợp cho bảng generates
"""

import json
import random
from bs4 import BeautifulSoup
from pathlib import Path

def parse_showcase_html(html_file_path, output_json_path=None):
    """
    Parse file HTML showcase.html và chuyển đổi thành JSON format
    
    Args:
        html_file_path (str): Đường dẫn đến file HTML
        output_json_path (str, optional): Đường dẫn file JSON output
    
    Returns:
        list: Danh sách các record theo format yêu cầu
    """
    
    # Đọc file HTML
    try:
        with open(html_file_path, 'r', encoding='utf-8') as file:
            html_content = file.read()
    except FileNotFoundError:
        print(f"Không tìm thấy file: {html_file_path}")
        return []
    except Exception as e:
        print(f"Lỗi khi đọc file: {e}")
        return []
    
    # Parse HTML với BeautifulSoup
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Tìm tất cả các thẻ img
    img_tags = soup.find_all('img')
    
    records = []
    
    for i, img in enumerate(img_tags, 1):
        # Lấy giá trị alt và src
        alt_text = img.get('alt', '')
        src_url = img.get('src', '')
        
        # Bỏ qua nếu không có alt hoặc src
        if not alt_text or not src_url:
            continue
        
        # Tạo seed ngẫu nhiên
        seed = random.randint(1000000000, 9999999999)
        
        # Tạo record theo format yêu cầu
        record = {
            'user_id': 2,
            'name': alt_text,
            'type': 'image',
            'status': 'completed',
            'share': 'public',
            'result_url': [
                {
                    "seed": seed,
                    "url": src_url
                }
            ],
            'content': {
                "prompt": alt_text,
                "model": "runware:97@2"
            }
        }
        
        records.append(record)
    
    print(f"Đã parse thành công {len(records)} records từ {len(img_tags)} thẻ img")
    
    # Xuất ra file JSON nếu có đường dẫn
    if output_json_path:
        try:
            with open(output_json_path, 'w', encoding='utf-8') as json_file:
                json.dump(records, json_file, ensure_ascii=False, indent=2)
            print(f"Đã lưu kết quả vào file: {output_json_path}")
        except Exception as e:
            print(f"Lỗi khi lưu file JSON: {e}")
    
    return records

def main():
    """Hàm main để chạy script"""
    
    # Đường dẫn file HTML
    html_file = r"d:\AI\nindemo\saas-backend\showcase.html"
    
    # Đường dẫn file JSON output
    json_file = r"d:\AI\nindemo\saas-backend\showcase_parsed.json"
    
    print("Bắt đầu parse file HTML...")
    print(f"File input: {html_file}")
    print(f"File output: {json_file}")
    print("-" * 50)
    
    # Parse HTML
    records = parse_showcase_html(html_file, json_file)
    
    if records:
        print(f"\nThành công! Đã tạo {len(records)} records")
        print("\nVí dụ record đầu tiên:")
        print(json.dumps(records[0], ensure_ascii=False, indent=2))
    else:
        print("Không có dữ liệu để parse!")

if __name__ == "__main__":
    main()