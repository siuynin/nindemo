<?php

namespace App\Console\Commands;

use App\Models\Voice;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use League\Csv\Reader;

class ImportVoicesFromCsv extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'voices:import {file_path : Path to the CSV file}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Import voices from CSV file to database';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $filePath = $this->argument('file_path');
        
        if (!file_exists($filePath)) {
            $this->error("File not found: {$filePath}");
            return 1;
        }

        $this->info("Starting import from: {$filePath}");
        
        try {
            // Read CSV file
            $csv = Reader::createFromPath($filePath, 'r');
            $csv->setHeaderOffset(0);
            $csv->setDelimiter(';');
            
            $records = $csv->getRecords();
            $imported = 0;
            $skipped = 0;
            $errors = 0;
            
            DB::beginTransaction();
            
            foreach ($records as $record) {
                try {
                    // Skip if voice_id already exists
                    if (Voice::where('voice_id', $record['voice_id'])->exists()) {
                        $skipped++;
                        $this->warn("Skipped duplicate voice_id: {$record['voice_id']}");
                        continue;
                    }
                    
                    // Parse fine_data JSON
                    $fineData = null;
                    if (!empty($record['fine_data']) && $record['fine_data'] !== 'NULL') {
                        $fineData = json_decode($record['fine_data'], true);
                        if (json_last_error() !== JSON_ERROR_NONE) {
                            $this->warn("Invalid JSON in fine_data for voice_id: {$record['voice_id']}");
                            $fineData = null;
                        }
                    }
                    
                    // Create voice record
                    Voice::create([
                        'user_id' => $record['user_id'] ?: 1, // Default to user 1 if not specified
                        'name' => $record['name'],
                        'voice_id' => $record['voice_id'],
                        'language' => !empty($record['language']) && $record['language'] !== 'NULL' ? $record['language'] : 'en',
                        'category' => !empty($record['category']) && $record['category'] !== 'NULL' ? $record['category'] : 'general',
                        'preview_url' => !empty($record['preview_url']) && $record['preview_url'] !== 'NULL' ? $record['preview_url'] : null,
                        'fine_data' => $fineData,
                        'gender' => !empty($record['gender']) && $record['gender'] !== 'NULL' ? $record['gender'] : null,
                        'age' => !empty($record['age']) && $record['age'] !== 'NULL' ? $record['age'] : null,
                        'description' => !empty($record['description']) && $record['description'] !== 'NULL' ? $record['description'] : null,
                        'platforms' => 'elevenlab', // Set as requested
                        'status' => !empty($record['status']) && $record['status'] !== 'NULL' ? (int)$record['status'] : 1,
                    ]);
                    
                    $imported++;
                    
                    if ($imported % 50 === 0) {
                        $this->info("Imported {$imported} voices...");
                    }
                    
                } catch (\Exception $e) {
                    $errors++;
                    $this->error("Error importing voice {$record['voice_id']}: " . $e->getMessage());
                }
            }
            
            DB::commit();
            
            $this->info("\n=== Import Summary ===");
            $this->info("Imported: {$imported} voices");
            $this->info("Skipped: {$skipped} duplicates");
            $this->info("Errors: {$errors}");
            
            if ($imported > 0) {
                $this->info("\n✅ Import completed successfully!");
                return 0;
            } else {
                $this->warn("\n⚠️  No new voices were imported.");
                return 0;
            }
            
        } catch (\Exception $e) {
            DB::rollBack();
            $this->error("Import failed: " . $e->getMessage());
            return 1;
        }
    }
}
