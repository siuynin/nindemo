<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\OpenAI;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class ImportOpenAIData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'openai:import {--file=openai.csv : Path to CSV file}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Import OpenAI data from CSV file into database';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $filePath = $this->option('file');
        
        // If relative path, make it absolute from project root
        if (!$this->isAbsolutePath($filePath)) {
            $filePath = base_path($filePath);
        }
        
        if (!File::exists($filePath)) {
            $this->error("File not found: {$filePath}");
            return 1;
        }
        
        $this->info("Starting import from: {$filePath}");
        
        try {
            DB::beginTransaction();
            
            // Clear existing data
            $this->info('Clearing existing data...');
            OpenAI::truncate();
            
            // Read and process CSV
            $this->info('Reading CSV file...');
            $csvData = $this->readCsvFile($filePath);
            
            $this->info('Processing ' . count($csvData) . ' records...');
            $progressBar = $this->output->createProgressBar(count($csvData));
            $progressBar->start();
            
            $successCount = 0;
            $errorCount = 0;
            
            foreach ($csvData as $row) {
                try {
                    $this->createOpenAIRecord($row);
                    $successCount++;
                } catch (\Exception $e) {
                    $errorCount++;
                    $this->error("Error processing row ID {$row['id']}: " . $e->getMessage());
                }
                $progressBar->advance();
            }
            
            $progressBar->finish();
            $this->newLine();
            
            DB::commit();
            
            $this->info("Import completed successfully!");
            $this->info("Records imported: {$successCount}");
            if ($errorCount > 0) {
                $this->warn("Records with errors: {$errorCount}");
            }
            
            return 0;
            
        } catch (\Exception $e) {
            DB::rollBack();
            $this->error('Import failed: ' . $e->getMessage());
            return 1;
        }
    }
    
    /**
     * Read CSV file and return array of data
     */
    private function readCsvFile($filePath)
    {
        $csvData = [];
        $headers = [];
        
        if (($handle = fopen($filePath, 'r')) !== FALSE) {
            // Read header row
            $headers = fgetcsv($handle);
            
            // Remove quotes from headers
            $headers = array_map(function($header) {
                return trim($header, '"');
            }, $headers);
            
            // Read data rows
            while (($data = fgetcsv($handle)) !== FALSE) {
                if (count($data) === count($headers)) {
                    $row = array_combine($headers, $data);
                    
                    // Clean up the data
                    $row = array_map(function($value) {
                        // Remove quotes and handle NULL values
                        $value = trim($value, '"');
                        return $value === 'NULL' ? null : $value;
                    }, $row);
                    
                    $csvData[] = $row;
                }
            }
            fclose($handle);
        }
        
        return $csvData;
    }
    
    /**
     * Create OpenAI record from CSV row
     */
    private function createOpenAIRecord($row)
    {
        // Validate required fields
        if (empty($row['title']) || empty($row['slug'])) {
            throw new \Exception('Missing required fields: title or slug');
        }
        
        // Prepare data for insertion
        $data = [
            'id' => (int) $row['id'],
            'user_id' => $row['user_id'] ? (int) $row['user_id'] : 2,
            'title' => $row['title'],
            'description' => $row['description'],
            'slug' => $row['slug'],
            'active' => (int) $row['active'],
            'questions' => $row['questions'],
            'image' => $row['image'],
            'premium' => (int) $row['premium'],
            'type' => $row['type'],
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at'],
            'prompt' => $row['prompt'],
            'custom_template' => (int) $row['custom_template'],
            'tone_of_voice' => (int) $row['tone_of_voice'],
            'color' => $row['color'],
            'filters' => $row['filters'],
            'package' => $row['package']
        ];
        
        // Create the record
        OpenAI::create($data);
    }
    
    /**
     * Check if path is absolute
     */
    private function isAbsolutePath($path)
    {
        // For Windows: check if path starts with drive letter (C:) or UNC path (\\)
        // For Unix: check if path starts with /
        return preg_match('/^([a-zA-Z]:\\|\\\\|\/)/', $path);
    }
}
