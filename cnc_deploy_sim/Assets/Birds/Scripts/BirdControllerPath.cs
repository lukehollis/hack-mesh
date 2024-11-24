using UnityEngine;

public class BirdControllerPath : MonoBehaviour
{
    public Transform target;
    public float journeyTime = 24f;
    public float heightMultiplier = 5f;
    public float resetTime = 30f;
    
    private Vector3 startPosition;
    private float elapsedTime;
    private bool isMoving;
    private float resetTimer;
    private Vector3 initialStartPosition;

    void Start()
    {
        initialStartPosition = transform.position;
        startPosition = transform.position;
        isMoving = true;
        elapsedTime = 0f;
        resetTimer = 0f;
    }

    void Update()
    {
        if (!isMoving || target == null) return;

        elapsedTime += Time.deltaTime;
        resetTimer += Time.deltaTime;
        float percentageComplete = elapsedTime / journeyTime;

        // Create a parabolic arc
        Vector3 currentPos = Vector3.Lerp(startPosition, target.position, percentageComplete);
        
        // Add height using a parabolic curve (sin curve would also work)
        float heightOffset = heightMultiplier * (percentageComplete * (1 - percentageComplete));
        currentPos.y += heightOffset;

        // Update position
        transform.position = currentPos;

        // Optional: Make the bird face the direction it's moving
        if (percentageComplete < 1f)
        {
            Vector3 nextPos = Vector3.Lerp(startPosition, target.position, Mathf.Min(1f, percentageComplete + 0.01f));
            nextPos.y += heightMultiplier * ((percentageComplete + 0.01f) * (1 - (percentageComplete + 0.01f)));
            transform.forward = (nextPos - transform.position).normalized;
        }

        // Check if we've completed the journey or exceeded reset time
        if (percentageComplete >= 1f || resetTimer >= resetTime)
        {
            ResetToInitial();
        }
    }

    public void ResetPath()
    {
        startPosition = transform.position;
        elapsedTime = 0f;
        isMoving = true;
    }

    private void ResetToInitial()
    {
        transform.position = initialStartPosition;
        startPosition = initialStartPosition;
        elapsedTime = 0f;
        resetTimer = 0f;
        isMoving = true;
    }
}