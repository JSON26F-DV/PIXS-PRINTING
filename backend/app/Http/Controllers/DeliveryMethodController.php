<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\DeliveryMethod;
use Illuminate\Http\JsonResponse;

class DeliveryMethodController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(DeliveryMethod::all());
    }
}
